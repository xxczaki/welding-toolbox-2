import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Keyboard, Clipboard, TouchableOpacity, View} from 'react-native';
import {Title, Subheading, TextInput, Button, Text, HelperText} from 'react-native-paper';
import ModalSelector from 'react-native-modal-selector';
import {useFormik} from 'formik';
import {object, string} from 'yup';
import {heatInput} from 'welding-utils';
import sec from 'sec';
import fromEntries from 'core-js-pure/features/object/from-entries';
import storage from '../storage.js';

import {useStopwatch} from '../hooks/use-stopwatch';

import Container from '../components/container';
import InputBox from '../components/input-box';
import ButtonBox from '../components/button-box';
import Inline from '../components/inline';

export default function HeatInputScreen() {
	const [settings, setSettings] = useState({});
	const [result, setResult] = useState(0);
	const [isDiameter, setDiameter] = useState(false);
	const {ms, start, stop, reset, isRunning} = useStopwatch();

	const fullValidationSchema = object().shape({
		amperage: string()
			.required('Required'),
		voltage: string()
			.required('Required'),
		length: string()
			.required('Required'),
		time: string()
			.required('Required'),
		efficiencyFactor: string()
			.required('Required')
	});

	const partialValidationSchema = object().shape({
		length: string()
			.required('Required'),
		totalEnergy: string()
			.required('Required')
	});

	const formik = useFormik({
		initialValues: {
			amperage: '',
			voltage: '',
			length: '',
			time: '',
			efficiencyFactor: '',
			totalEnergy: ''
		},
		validationSchema: settings?.totalEnergy ? partialValidationSchema : fullValidationSchema,
		onSubmit: values => {
			Keyboard.dismiss();

			const keys = Object.keys(values);
			const formattedValues = Object.values(values).map(e => {
				if (typeof e === 'string' && e.includes(':')) {
					return e;
				}

				return Number(e.toString().replace(/,/g, '.'));
			});

			const data = fromEntries(keys.map((_, i) => [keys[i], formattedValues[i]]));
			let result;

			if (settings?.lengthImperial && settings?.resultUnit !== 'in') {
				data.length *= 25.4;
			}

			if (settings?.totalEnergy) {
				result = data.totalEnergy / data.length;
			} else {
				data.time = sec((data.time).toString());

				if (isDiameter) {
					data.length = Number((data.length * Math.PI).toFixed(2));
				}

				result = heatInput(data);
			}

			if (settings?.resultUnit === 'cm') {
				result *= 10;
			} else if (settings?.resultUnit === 'in' && !settings?.lengthImperial) {
				result *= 25.4;
			}

			if (isNaN(result)) {
				setResult(0);
			} else {
				setResult(Math.round((result + Number.EPSILON) * 1000) / 1000);
			}
		},
		onReset: () => {
			reset();
			setResult(0);
		},
		validateOnBlur: false,
		validateOnChange: false
	});

	useFocusEffect(
		useCallback(() => {
			storage.get('settings').then(data => {
				setSettings(JSON.parse(data));

				if (result !== '0') {
					setResult(0);
				}
			});
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])
	);

	const handleStartStop = () => {
		if (isRunning) {
			stop();
			formik.setFieldValue('time', ms / 1000);
		} else {
			start();
		}
	};

	const data = [{
		label: '0.6 - 141, 15',
		key: '0.6'
	}, {
		label: '0.8 - 111, 114, 131, 135, 136, 138',
		key: '0.8'
	}, {
		label: '1 - 121',
		key: '1'
	}];

	return (
		<Container
			contentContainerStyle={{alignItems: 'center', justifyContent: 'center'}}
			keyboardShouldPersistTaps="handled"
		>
			<Title style={{fontSize: 32, paddingTop: 25}}>Heat Input Calculator</Title>
			<TouchableOpacity onPress={() => Clipboard.setString(`${result}`)}>
				<Subheading style={{fontSize: 20}}>Heat Input: {result} kJ/{settings?.resultUnit}</Subheading>
			</TouchableOpacity>
			{!settings?.totalEnergy &&
				<InputBox>
					<View>
						<TextInput
							style={{marginRight: 10, width: 150}}
							keyboardType="numeric"
							label="Amps"
							value={formik.values.amperage}
							maxLength={10}
							onChangeText={formik.handleChange('amperage')}
							onBlur={formik.handleBlur('amperage')}
						/>
						<HelperText
							type="error"
							visible={formik.errors.amperage}
						>
							{formik.errors.amperage}
						</HelperText>
					</View>
					<View>
						<TextInput
							style={{marginLeft: 10, width: 150}}
							keyboardType="numeric"
							label="Volts"
							value={formik.values.voltage}
							maxLength={10}
							onChangeText={formik.handleChange('voltage')}
							onBlur={formik.handleBlur('voltage')}
						/>
						<HelperText
							type="error"
							visible={formik.errors.voltage}
						>
							{formik.errors.voltage}
						</HelperText>
					</View>
				</InputBox>}
			<InputBox>
				<View>
					{!settings?.totalEnergy ?
						<>
							<TextInput
								style={{marginRight: 10, width: 150}}
								keyboardType="numeric"
								label={isDiameter ? `Diameter (${settings?.lengthImperial ? 'in' : 'mm'})` : `Length (${settings?.lengthImperial ? 'in' : 'mm'})`}
								value={formik.values.length}
								maxLength={10}
								onChangeText={formik.handleChange('length')}
								onBlur={formik.handleBlur('length')}
							/>
							<HelperText
								type="error"
								visible={formik.errors.length}
							>
								{formik.errors.length}
							</HelperText>
						</> :
						<>
							<TextInput
								style={{marginRight: 10, width: 150}}
								keyboardType="numeric"
								label="Total energy (kJ)"
								value={formik.values.totalEnergy}
								maxLength={10}
								onChangeText={formik.handleChange('totalEnergy')}
								onBlur={formik.handleBlur('totalEnergy')}
							/>
							<HelperText
								type="error"
								visible={formik.errors.totalEnergy}
							>
								{formik.errors.totalEnergy}
							</HelperText>
						</>}
				</View>
				<View>
					{!settings?.totalEnergy ?
						<>
							<TextInput
								style={{marginLeft: 10, width: 150}}
								keyboardType="numeric"
								label="Time (sec)"
								value={ms === 0 ? formik.values.time : new Date(ms).toISOString().slice(11, -5).toString()}
								maxLength={10}
								onChangeText={formik.handleChange('time')}
								onBlur={formik.handleBlur('time')}
							/>
							<HelperText
								type="error"
								visible={formik.errors.time}
							>
								{formik.errors.time}
							</HelperText>
						</> :
						<>
							<TextInput
								style={{marginLeft: 10, width: 150}}
								keyboardType="numeric"
								label={`Length (${settings?.lengthImperial ? 'in' : 'mm'})`}
								value={formik.values.length}
								maxLength={10}
								onChangeText={formik.handleChange('length')}
								onBlur={formik.handleBlur('length')}
							/>
							<HelperText
								type="error"
								visible={formik.errors.length}
							>
								{formik.errors.length}
							</HelperText>
						</>}
				</View>
			</InputBox>
			{!settings?.totalEnergy &&
				<>
					<ButtonBox>
						<Button
							style={{width: 150, marginRight: 10}}
							color="#00b0ff"
							icon={isDiameter ? 'diameter-variant' : 'ruler'}
							mode="contained"
							onPress={() => isDiameter ? setDiameter(false) : setDiameter(true)}
						>
							{isDiameter ? 'Diameter' : 'Length'}
						</Button>

						<Button
							style={{width: 150, marginLeft: 10}}
							color="#00b0ff"
							icon={isRunning ? 'pause' : (ms !== 0 ? 'play' : 'timer')}
							mode="contained"
							onPress={handleStartStop}
						>
							{isRunning ? 'Pause' : (ms !== 0 ? 'Resume' : 'Measure')}
						</Button>

					</ButtonBox>
					<ModalSelector
						style={{width: 300, paddingTop: 20, paddingBottom: 20}}
						selectTextStyle={{color: '#fff'}}
						data={data}
						selectedKey={formik.values.efficiencyFactor}
						initValue="Efficiency Factor"
						cancelText="Cancel"
						onChange={option => formik.setFieldValue('efficiencyFactor', option.key)}
					/>
					{formik.errors.efficiencyFactor ? <Text style={{color: '#cf6679'}}>Please select the efficiency factor</Text> : null}
				</>}
			<Inline>
				<Button color="#4caf50" icon="check" mode="contained" onPress={formik.handleSubmit}>
		Calculate
				</Button>
				<Button style={{marginLeft: 15}} color="#e53935" icon="delete" mode="contained" onPress={formik.handleReset}>
		Reset
				</Button>
			</Inline>
		</Container>
	);
}
