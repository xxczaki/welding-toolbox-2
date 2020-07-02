import React, {useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Keyboard, View} from 'react-native';
import {Picker} from '@react-native-community/picker';
import Clipboard from '@react-native-community/clipboard';
import {TextInput, Button, Text, HelperText, FAB as Fab, Card, Appbar} from 'react-native-paper';
import {useFormik} from 'formik';
import {object, string} from 'yup';
import {heatInput} from 'welding-utils';
import sec from 'sec';
import storage from '../storage.js';

import {useStopwatch} from '../hooks/use-stopwatch';

import Container from '../components/container';
import InputBox from '../components/input-box';
import ButtonBox from '../components/button-box';

const HeatInputScreen = () => {
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
			const formattedValues = Object.values(values).map(element => {
				if (typeof element === 'string' && element.includes(':')) {
					return element;
				}

				return Number(element.toString().replace(/,/g, '.'));
			});

			const data = Object.fromEntries(keys.map((_, i) => [keys[i], formattedValues[i]]));
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

			if (Number.isNaN(result)) {
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
			(async () => {
				const data = await storage.get('settings');

				setSettings(JSON.parse(data));

				if (result !== '0') {
					setResult(0);
				}
			})();
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

	return (
		<>
			<Appbar.Header>
				<Appbar.Content title="Welding Toolbox 2"/>
				<Appbar.Action icon="delete" onPress={formik.resetForm}/>
			</Appbar.Header>
			<Container
				contentContainerStyle={{alignItems: 'center', height: '100%'}}
				keyboardShouldPersistTaps="handled"
			>
				<Card style={{height: 100, width: '90%', marginTop: 20}}>
					<Card.Title title={`Result: ${result} kJ/${settings?.resultUnit ?? 'mm'}`}/>
					<Card.Actions>
						<Button onPress={() => Clipboard.setString(`${result}`)}>Copy</Button>
					</Card.Actions>
				</Card>
				{!settings?.totalEnergy &&
					<InputBox>
						<View>
							<TextInput
								style={{marginRight: 10, width: 165}}
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
								style={{marginLeft: 10, width: 165}}
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
									style={{marginRight: 10, width: 165}}
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
									style={{marginRight: 10, width: 165}}
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
									style={{marginLeft: 10, width: 165}}
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
									style={{marginLeft: 10, width: 165}}
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
								style={{width: 165, marginRight: 10}}
								color="#ff9800"
								icon={isDiameter ? 'diameter-variant' : 'ruler'}
								mode="contained"
								onPress={() => isDiameter ? setDiameter(false) : setDiameter(true)}
							>
								{isDiameter ? 'Diameter' : 'Length'}
							</Button>

							<Button
								style={{width: 165, marginLeft: 10}}
								color="#ff9800"
								icon={isRunning ? 'pause' : (ms !== 0 ? 'play' : 'timer')}
								mode="contained"
								onPress={handleStartStop}
							>
								{isRunning ? 'Pause' : (ms !== 0 ? 'Resume' : 'Measure')}
							</Button>

						</ButtonBox>
						<View style={{width: '80%'}}>
							<Picker
								selectedValue={formik.values.efficiencyFactor}
								style={{color: 'gray'}}
								onValueChange={value => formik.setFieldValue('efficiencyFactor', value)}
							>
								<Picker.Item label="Select efficiency factor" value={null}/>
								<Picker.Item label="0.6 - 141, 15" value="0.6"/>
								<Picker.Item label="0.8 - 111, 114, 131, 135, 136, 138" value="0.8"/>
								<Picker.Item label="1 - 121" value="1"/>
							</Picker>
							{formik.errors.efficiencyFactor ? <Text style={{color: '#cf6679', textAlign: 'center'}}>Please select the efficiency factor</Text> : null}
						</View>
					</>}
				<Fab
					style={{position: 'absolute', right: 20, bottom: 20, backgroundColor: '#4caf50'}}
					color="#000"
					icon="check"
					label="Calculate"
					onPress={formik.handleSubmit}
				/>
			</Container>
		</>
	);
};

export default HeatInputScreen;
