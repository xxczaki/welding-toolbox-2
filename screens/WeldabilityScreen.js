import React, {useState} from 'react';
import {Keyboard} from 'react-native';
import {Title, Text, TextInput, Button} from 'react-native-paper';
import {Col, Grid} from 'react-native-easy-grid';
import {useFormik} from 'formik';

import Container from '../components/container';
import Inline from '../components/inline';

export default function WeldabilityScreen() {
	const [result, setResult] = useState({
		ceq: '0',
		cet: '0',
		ceAws: '0',
		pcm: '0',
		pren: '0'
	});
	const formik = useFormik({
		initialValues: {
			coal: '',
			manganese: '',
			chromium: '',
			molybdenum: '',
			vanadium: '',
			nickel: '',
			copper: '',
			silicon: '',
			boron: '',
			nitrogen: ''
		},
		onSubmit: values => {
			Keyboard.dismiss();

			const c = Number(values.coal.replace(/,/g, '.'));
			console.log(c);
			const mn = Number(values.manganese.replace(/,/g, '.'));
			const cr = Number(values.chromium.replace(/,/g, '.'));
			const mo = Number(values.molybdenum.replace(/,/g, '.'));
			const v = Number(values.vanadium.replace(/,/g, '.'));
			const ni = Number(values.nickel.replace(/,/g, '.'));
			const cu = Number(values.copper.replace(/,/g, '.'));
			const si = Number(values.silicon.replace(/,/g, '.'));
			const b = Number(values.boron.replace(/,/g, '.'));
			const n = Number(values.nitrogen.replace(/,/g, '.'));

			/* eslint-disable no-mixed-operators */

			const calculateCeq = () => {
				return (c + (mn / 6) + (cr + mo + v) / 5 + (ni + cu) / 15);
			};

			const calculateCet = () => {
				return (c + (mn + mo) / 10 + (cr + cu) / 20 + (ni / 40));
			};

			const calculateCeAws = () => {
				return (c + (mn / 6) + (cr + mo + v) / 5 + (ni + cu) / 15 + (si / 6));
			};

			const calculatePcm = () => {
				return (c + (si / 30) + (mn + cu + cr) / 20 + (ni / 60) + (mo / 15) + (v / 10) + 5 * b);
			};

			const calculatePren = () => {
				return (cr + (3.3 * mo) + (16 * n));
			};

			/* eslint-enable no-mixed-operators */

			const ceqResult = Math.round(calculateCeq() * 100) / 100;
			const cetResult = Math.round(calculateCet() * 100) / 100;
			const ceAwsResult = Math.round(calculateCeAws() * 100) / 100;
			const pcmResult = Math.round(calculatePcm() * 100) / 100;
			const prenResult = Math.round(calculatePren() * 100) / 100;

			setResult({
				ceq: ceqResult,
				cet: cetResult,
				ceAws: ceAwsResult,
				pcm: pcmResult,
				pren: prenResult
			});
		},
		onReset: (values, {resetForm}) => {
			resetForm();
			setResult({
				ceq: '0',
				cet: '0',
				ceAws: '0',
				pcm: '0',
				pren: '0'
			});
		}
	});

	return (
		<Container
			contentContainerStyle={{alignItems: 'center', justifyContent: 'center'}}
			keyboardShouldPersistTaps="handled"
		>
			<Title style={{fontSize: 32}}>Weldability Calculator</Title>
			<Grid style={{marginTop: 25}}>
				<Col style={{paddingLeft: 20, justifyContent: 'center'}}>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="C"
						value={formik.values.coal}
						maxLength={10}
						onChangeText={formik.handleChange('coal')}
						onBlur={formik.handleBlur('coal')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="Mn"
						value={formik.values.manganese}
						maxLength={10}
						onChangeText={formik.handleChange('manganese')}
						onBlur={formik.handleBlur('manganese')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="Si"
						value={formik.values.silicon}
						maxLength={10}
						onChangeText={formik.handleChange('silicon')}
						onBlur={formik.handleBlur('silicon')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="Cr"
						value={formik.values.chromium}
						maxLength={10}
						onChangeText={formik.handleChange('chromium')}
						onBlur={formik.handleBlur('chromium')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="Ni"
						value={formik.values.nickel}
						maxLength={10}
						onChangeText={formik.handleChange('nickel')}
						onBlur={formik.handleBlur('nickel')}
					/>
				</Col>
				<Col style={{justifyContent: 'center'}}>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="Mo"
						value={formik.values.molybdenum}
						maxLength={10}
						onChangeText={formik.handleChange('molybdenum')}
						onBlur={formik.handleBlur('molybdenum')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="Cu"
						value={formik.values.copper}
						maxLength={10}
						onChangeText={formik.handleChange('copper')}
						onBlur={formik.handleBlur('copper')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="V"
						value={formik.values.vanadium}
						maxLength={10}
						onChangeText={formik.handleChange('vanadium')}
						onBlur={formik.handleBlur('vanadium')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="N"
						value={formik.values.nitrogen}
						maxLength={10}
						onChangeText={formik.handleChange('nitrogen')}
						onBlur={formik.handleBlur('nitrogen')}
					/>
					<TextInput
						style={{width: 75, marginBottom: 15}}
						keyboardType="numeric"
						placeholder="B"
						value={formik.values.boron}
						maxLength={10}
						onChangeText={formik.handleChange('boron')}
						onBlur={formik.handleBlur('boron')}
					/>
				</Col>
				<Col style={{paddingLeft: -20, justifyContent: 'center'}}>
					<Text>CEQ: {result.ceq}</Text>
					<Text>CET: {result.cet}</Text>
					<Text>CE (AWS): {result.ceAws}</Text>
					<Text>PCM: {result.pcm}</Text>
					<Text>PREN: {result.pren}</Text>
				</Col>
			</Grid>
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

WeldabilityScreen.navigationOptions = {
	header: null
};
