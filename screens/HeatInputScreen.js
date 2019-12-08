import React, {useState} from 'react';
import {Keyboard, Clipboard, TouchableOpacity} from 'react-native';
import {Title, Subheading, TextInput, Button} from 'react-native-paper';
import {Dropdown} from 'react-native-material-dropdown';
import {useFormik} from 'formik';
import {heatInput} from 'welding-utils';

import Container from '../components/container';
import InputBox from '../components/input-box';
import Inline from '../components/inline';

export default function HeatInputScreen() {
	const [result, setResult] = useState(0);
	const [timerOn, setTimerOn] = useState(false);
	const [timer, setTimer] = useState({
		timerStart: 0,
		timerTime: 0
	});
	const [intervalId, setIntervalId] = useState(undefined);
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
			setResult(0);
			setTimer({
				timerOn: false,
				timerTime: 0,
				timerStart: 0
			})
		}
	});

	const startTimer = () => {
		setTimer({
			timerOn: true,
			timerTime: timer.timerTime,
			timerStart: Date.now() - timer.timerTime
		})
		const id = setInterval(() => {
			setTimer({
				timerOn: true,
				timerStart: timer.timerStart,
				timerTime: Date.now() - timer.timerStart
			});
		}, 10)
		setIntervalId(id);
	};

	const stopTimer = () => {
		setTimer({
			timerOn: false,
			timerStart: timer.timerStart,
			timerTime: timer.timerTime
		})
		clearInterval(intervalId);
	}

	const data = [{
		label: '0.6 - 141, 15',
		value: '0.6'
	}, {
		label: '0.8 - 111, 114, 131, 135, 136, 138',
		value: '0.8'
	}, {
		label: '1 - 121',
		value: '1'
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
					value={timer.timerTime}
					maxLength={10}
					onChangeText={formik.handleChange('time')}
					onBlur={formik.handleBlur('time')}
				/>
			</InputBox>
			<Button
				style={{width: 150, marginTop: 10, marginLeft: 'auto', marginRight: 25}}
				color="#00b0ff"
				icon={timerOn ? 'pause' : 'timer'}
				mode="contained"
				onPress={() => {
					if (!timerOn && timer.timerTime === 0) {
						startTimer();
					} else if (!timerOn && timer.timerTime > 0) {
						startTimer();
					} else {
						stopTimer();
					}
				}}
			>
				{timerOn ? 'Pause' : 'Measure'}
			</Button>
			<Dropdown
				containerStyle={{width: 300}}
				label="Efficiency Factor"
				data={data}
				onChangeText={formik.handleChange('efficiencyFactor')}
			/>
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
