import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { Col, Grid } from 'react-native-easy-grid';
import { Appbar, Card, FAB as Fab, Text, TextInput } from 'react-native-paper';
import { ceAws, ceq, cet, pcm, pren } from 'welding-utils';

import Inline from '../components/inline';

const WeldabilityScreen = () => {
	const [result, setResult] = useState({
		ceq: '0',
		cet: '0',
		ceAws: '0',
		pcm: '0',
		pren: '0',
	});

	const {
		control,
		handleSubmit,
		formState: { isDirty },
		reset,
	} = useForm({
		defaultValues: {
			carbon: '',
			manganese: '',
			chromium: '',
			molybdenum: '',
			vanadium: '',
			nickel: '',
			copper: '',
			silicon: '',
			boron: '',
			nitrogen: '',
		},
	});

	const onSubmit = (data) => {
		Keyboard.dismiss();

		const carbon = Number(data.carbon.replace(/,/g, '.'));
		const manganese = Number(data.manganese.replace(/,/g, '.'));
		const chromium = Number(data.chromium.replace(/,/g, '.'));
		const molybdenum = Number(data.molybdenum.replace(/,/g, '.'));
		const vanadium = Number(data.vanadium.replace(/,/g, '.'));
		const nickel = Number(data.nickel.replace(/,/g, '.'));
		const copper = Number(data.copper.replace(/,/g, '.'));
		const silicon = Number(data.silicon.replace(/,/g, '.'));
		const boron = Number(data.boron.replace(/,/g, '.'));
		const nitrogen = Number(data.nitrogen.replace(/,/g, '.'));

		const ceqCetData = {
			carbon,
			manganese,
			chromium,
			molybdenum,
			vanadium,
			nickel,
			copper,
		};

		const ceAwsData = {
			silicon,
			carbon,
			manganese,
			chromium,
			molybdenum,
			vanadium,
			nickel,
			copper,
		};

		const pcmData = {
			silicon,
			boron,
			carbon,
			manganese,
			chromium,
			molybdenum,
			vanadium,
			nickel,
			copper,
		};

		const prenData = {
			nitrogen,
			chromium,
			molybdenum,
		};

		const ceqResult = Math.round(ceq(ceqCetData) * 100) / 100;
		const cetResult = Math.round(cet(ceqCetData) * 100) / 100;
		const ceAwsResult = Math.round(ceAws(ceAwsData) * 100) / 100;
		const pcmResult = Math.round(pcm(pcmData) * 100) / 100;
		const prenResult = Math.round(pren(prenData) * 100) / 100;

		setResult({
			ceq: ceqResult,
			cet: cetResult,
			ceAws: ceAwsResult,
			pcm: pcmResult,
			pren: prenResult,
		});
	};

	const resetForm = () => {
		reset();
		setResult({
			ceq: '0',
			cet: '0',
			ceAws: '0',
			pcm: '0',
			pren: '0',
		});
	};

	return (
		<View style={{ flex: 1 }}>
			<Appbar.Header>
				<Appbar.Content title="Weldability" />
				<Appbar.Action icon="delete" onPress={resetForm} disabled={!isDirty} />
			</Appbar.Header>
			<KeyboardAvoidingView
				enabled
				style={{
					flex: 1,
					flexDirection: 'column',
					justifyContent: 'center',
					backgroundColor: '#121212',
				}}
				behavior="padding"
				keyboardVerticalOffset={50}
			>
				<ScrollView
					contentContainerStyle={{
						alignItems: 'center',
						flexGrow: 1,
						backgroundColor: '#121212',
					}}
					keyboardShouldPersistTaps="handled"
				>
					<Card
						style={{
							height: 100,
							width: '95%',
							marginTop: 15,
							marginBottom: 10,
						}}
					>
						<Card.Title title="Results" />
						<Card.Content>
							<Inline>
								<Text>CEQ: {result.ceq}</Text>
								<Text>CET: {result.cet}</Text>
								<Text>CE (AWS): {result.ceAws}</Text>
								<Text>PCM: {result.pcm}</Text>
								<Text>PREN: {result.pren}</Text>
							</Inline>
						</Card.Content>
					</Card>
					<Grid style={{ paddingBottom: 70 }}>
						<Col style={{ alignItems: 'center' }}>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Carbon (C)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="carbon"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Manganese (Mn)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="manganese"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Silicon (Si)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="silicon"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Chromium (Cr)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="chromium"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Nickel (Ni)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="nickel"
								rules={{ required: true }}
								defaultValue=""
							/>
						</Col>
						<Col style={{ alignItems: 'center' }}>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Molybdenum (Mo)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="molybdenum"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Copper (Cu)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="copper"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Vanadium (V)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="vanadium"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Nitrogen (N)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="nitrogen"
								rules={{ required: true }}
								defaultValue=""
							/>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<TextInput
										style={{ width: '90%', marginBottom: 15 }}
										keyboardType="numeric"
										label="Boron (B)"
										value={value}
										maxLength={10}
										mode="outlined"
										onBlur={onBlur}
										onChangeText={(value) => onChange(value)}
									/>
								)}
								name="boron"
								rules={{ required: true }}
								defaultValue=""
							/>
						</Col>
					</Grid>
				</ScrollView>
			</KeyboardAvoidingView>
			<Fab
				style={{
					position: 'absolute',
					right: 20,
					bottom: 20,
					backgroundColor: '#4caf50',
				}}
				color="#000"
				icon="check"
				label="Calculate"
				onPress={handleSubmit(onSubmit)}
			/>
		</View>
	);
};

export default WeldabilityScreen;
