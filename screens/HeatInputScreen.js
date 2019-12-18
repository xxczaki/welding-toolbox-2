import React, {useState} from 'react';
import {Keyboard, Clipboard, TouchableOpacity, View} from 'react-native';
import {Title, Subheading, TextInput, Button, Text, HelperText} from 'react-native-paper';
import ModalSelector from 'react-native-modal-selector';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {heatInput} from 'welding-utils';
import {useStopwatch} from '../hooks/use-stopwatch';

import Container from '../components/container';
import InputBox from '../components/input-box';
import Inline from '../components/inline';

const validationSchema = Yup.object().shape({
	amperage: Yup.string()
		.required('Required'),
	voltage: Yup.string()
		.required('Required'),
	lenght: Yup.string()
		.required('Required'),
	time: Yup.string()
		.required('Required'),
	efficiencyFactor: Yup.string()
		.required('Required')
});

export default function HeatInputScreen() {
	const [result, setResult] = useState(0);
	const {ms, start, stop, reset, isRunning} = useStopwatch();
	const formik = useFormik({
		initialValues: {
			amperage: '',
			voltage: '',
			lenght: '',
			time: '',
			efficiencyFactor: ''
		},
		validationSchema,
		onSubmit: values => {
			Keyboard.dismiss();

			const raw = heatInput(values);

			const result = Math.round(raw * 100) / 100;

			if (isNaN(result)) {
				setResult(0);
			} else {
				setResult(result);
			}
		},
		onReset: (values, {resetForm}) => {
			resetForm();
			reset();
			setResult(0);
		},
		validateOnBlur: false,
		validateOnChange: false
	});

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
			<Title style={{fontSize: 32, marginBottom: 2}}>Heat Input Calculator</Title>
			<TouchableOpacity onPress={() => Clipboard.setString(`${result}`)}>
				<Subheading style={{fontSize: 20}}>Heat Input: {result} kJ/mm</Subheading>
			</TouchableOpacity>
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
			</InputBox>
			<InputBox>
				<View>
					<TextInput
						style={{marginRight: 10, width: 150}}
						keyboardType="numeric"
						label="Lenght (mm)"
						value={formik.values.lenght}
						maxLength={10}
						onChangeText={formik.handleChange('lenght')}
						onBlur={formik.handleBlur('lenght')}
					/>
					<HelperText
						type="error"
						visible={formik.errors.lenght}
					>
						{formik.errors.lenght}
					</HelperText>
				</View>
				<View>
					<TextInput
						style={{marginLeft: 10, width: 150}}
						keyboardType="numeric"
						label="Time (sec)"
						value={ms === 0 ? formik.values.time : (ms / 1000).toString()}
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
				</View>
			</InputBox>
			<Button
				style={{width: 150, marginTop: 10, marginLeft: 'auto', marginRight: 25}}
				color="#00b0ff"
				icon={isRunning ? 'pause' : (ms !== 0 ? 'play' : 'timer')}
				mode="contained"
				onPress={handleStartStop}
			>
				{isRunning ? 'Pause' : (ms !== 0 ? 'Resume' : 'Measure')}
			</Button>
			<ModalSelector
				style={{width: 300, paddingTop: 20, paddingBottom: 20}}
				selectTextStyle={{color: '#fff'}}
				data={data}
				selectedKey={formik.values.efficiencyFactor}
				initValue="Efficiency Factor"
				cancelText="Cancel"
				onChange={option => formik.setFieldValue('efficiencyFactor', option.key)}/>
			{formik.errors.efficiencyFactor ? <Text style={{color: '#cf6679'}}>Please select the efficiency factor</Text> : null}
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

HeatInputScreen.navigationOptions = {
	header: null
};
