import React, {useState} from 'react';
import {Keyboard, Clipboard, TouchableOpacity} from 'react-native';
import {Title, Subheading, TextInput, Button, FAB} from 'react-native-paper';
import ModalSelector from 'react-native-modal-selector';
import {useFormik} from 'formik';
import {heatInput} from 'welding-utils';
import TimeFormatter from 'minutes-seconds-milliseconds';
import {useStopwatch} from '../hooks/use-stopwatch';

import Container from '../components/container';
import InputBox from '../components/input-box';

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
		}
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
				<TextInput
					style={{marginRight: 10, width: 150}}
					keyboardType="numeric"
					label="Amps"
					value={formik.values.amperage}
					maxLength={10}
					onChangeText={formik.handleChange('amperage')}
					onBlur={formik.handleBlur('amperage')}
				/>
				<TextInput
					style={{marginLeft: 10, width: 150}}
					keyboardType="numeric"
					label="Volts"
					value={formik.values.voltage}
					maxLength={10}
					onChangeText={formik.handleChange('voltage')}
					onBlur={formik.handleBlur('voltage')}
				/>
			</InputBox>
			<InputBox>
				<TextInput
					style={{marginRight: 10, width: 150}}
					keyboardType="numeric"
					label="Lenght (mm)"
					value={formik.values.lenght}
					maxLength={10}
					onChangeText={formik.handleChange('lenght')}
					onBlur={formik.handleBlur('lenght')}
				/>
				<TextInput
					style={{marginLeft: 10, width: 150}}
					keyboardType="numeric"
					label="Time (sec)"
					value={ms === 0 ? formik.values.time : TimeFormatter(ms)}
					maxLength={10}
					onChangeText={formik.handleChange('time')}
					onBlur={formik.handleBlur('time')}
				/>
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
				data={data}
				initValue="Efficiency Factor"
				onChange={option => formik.setFieldValue('efficiencyFactor', option.key)}/>
			<FAB
				style={{
					position: 'fixed',
					backgroundColor: '#4caf50',
					margin: 16,
					right: 50,
					bottom: 0
				}}
				label="Calculate"
				icon="check"
				onPress={formik.handleSubmit}
			/>
			<FAB
				style={{
					position: 'absolute',
					backgroundColor: '#e53935',
					margin: 16,
					right: 16,
					bottom: 0
				}}
				label="Reset"
				icon="delete"
				onPress={formik.handleReset}
			/>
		</Container>
	);
}

HeatInputScreen.navigationOptions = {
	header: null
};
