import { yupResolver } from '@hookform/resolvers/yup';
import Clipboard from '@react-native-clipboard/clipboard';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import camelCase from 'camelcase';
import React, { useState, useEffect, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	View,
} from 'react-native';
import {
	Appbar,
	Button,
	Card,
	FAB as Fab,
	HelperText,
	IconButton,
	Text,
	TextInput,
} from 'react-native-paper';
import sec from 'sec';
import { heatInput } from 'welding-utils';
import { object, string } from 'yup';

import { useStopwatch } from '../hooks/use-stopwatch';
import storage from '../storage.js';

const HeatInputScreen = ({ navigation }) => {
	const [settings, setSettings] = useState({});
	const [result, setResult] = useState(0);
	const [isDiameter, setDiameter] = useState(false);
	const [time, setTime] = useState(0);
	const { ms, start, stop, resetStopwatch, isRunning } = useStopwatch();

	const fullValidationSchema = object().shape({
		amperage: string().required('Required'),
		voltage: string().required('Required'),
		length: string().required('Required'),
		time: string().required('Required'),
		efficiencyFactor: string().required('Required'),
	});

	const partialValidationSchema = object().shape({
		length: string().required('Required'),
		totalEnergy: string().required('Required'),
	});

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
		reset,
		setValue,
	} = useForm({
		defaultValues: {
			amperage: '',
			voltage: '',
			length: '',
			time: '',
			efficiencyFactor: '',
			totalEnergy: '',
		},
		resolver: yupResolver(
			settings?.totalEnergy ? partialValidationSchema : fullValidationSchema,
		),
		reValidateMode: 'onSubmit',
	});

	useFocusEffect(
		useCallback(() => {
			(async () => {
				const data = await storage.getItem('settings');

				setSettings(JSON.parse(data));

				if (result !== 0) {
					setResult(0);
				}
			})();
		}, [result]),
	);

	useEffect(() => {
		(async () => {
			const data = await storage.getItem('settings');

			await storage.setItem(
				'settings',
				JSON.stringify({ ...JSON.parse(data), ...settings }),
			);
		})();
	}, [settings]);

	useEffect(() => {
		if (isRunning) {
			setValue(
				'time',
				new Date(ms + time).toISOString().slice(11, -5).toString(),
				{ shouldDirty: true },
			);
		}
	}, [isRunning, ms, time, setValue]);

	const handleStartStop = () => {
		if (isRunning) {
			stop();
			setTime((previous) => previous + ms);
		} else {
			start();
		}
	};

	const onSubmit = (_data) => {
		Keyboard.dismiss();

		const standardFields = new Set([
			'amperage',
			'voltage',
			'length',
			'time',
			'efficiencyFactor',
			'totalEnergy',
		]);

		const keys = Object.keys(_data);
		const formattedValues = Object.values(_data).map((element, index) => {
			if (
				typeof element === 'string' &&
				(element.includes(':') || !standardFields.has(keys[index]))
			) {
				return element;
			}

			return Number(element.toString().replace(/,/g, '.'));
		});

		const data = Object.fromEntries(
			keys.map((_, i) => [keys[i], formattedValues[i]]),
		);
		let result: number;

		if (settings?.lengthImperial && settings?.resultUnit !== 'in') {
			data.length *= 25.4;
		}

		if (settings?.totalEnergy) {
			result = data.totalEnergy / data.length;
		} else {
			data.time = sec(data.time.toString());

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

		const custom = settings?.customFields.map((element) => {
			const index = Object.keys(data).indexOf(camelCase(element.name));

			return {
				[element.name]: `${Object.values(data)[index] ?? 'N/A'} ${Object.values(data)[index] ? element.unit : ''}`,
			};
		});

		setSettings({
			...settings,
			resultHistory: [
				Object.assign(
					{
						Date: new Date().toLocaleString(),
						Amperage: data.amperage || 'N/A',
						Voltage: data.voltage || 'N/A',
						'Total energy': data.totalEnergy ? `${data.totalEnergy} kJ` : 'N/A',
						Length: `${data.length} ${settings?.lengthImperial ? 'in' : 'mm'}`,
						Time: data.time ? `${sec(data.time.toString())}s` : 'N/A',
						'Efficiency factor': data.efficiencyFactor,
						'Heat Input': `${Math.round((result + Number.EPSILON) * 1000) / 1000} kJ/${settings?.resultUnit}`,
					},
					...custom,
				),
				...(settings?.resultHistory ?? {}),
			],
		});
	};

	const resetForm = () => {
		reset();
		resetStopwatch();
		setTime(0);
		setResult(0);
	};

	return (
		<View style={{ flex: 1 }}>
			<Appbar.Header>
				<Appbar.Content title="Heat Input" />
				<Appbar.Action icon="delete" onPress={resetForm} />
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
						flexGrow: 1,
						backgroundColor: '#121212',
						padding: 20,
					}}
					keyboardShouldPersistTaps="handled"
				>
					<Card style={{ width: '100%', marginBottom: 15 }}>
						<Card.Title
							title={`Result: ${result} kJ/${settings?.resultUnit ?? 'mm'}`}
						/>
						<Card.Actions>
							<Button onPress={() => Clipboard.setString(`${result}`)}>
								Copy
							</Button>
							<Button onPress={() => navigation.navigate('History')}>
								History
							</Button>
						</Card.Actions>
					</Card>
					{!settings?.totalEnergy && (
						<View
							style={{
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<View style={{ width: '48%' }}>
								<Controller
									control={control}
									render={({ field: { onChange, onBlur, value } }) => (
										<TextInput
											keyboardType="numeric"
											label="Amps"
											value={value}
											maxLength={10}
											mode="outlined"
											onBlur={onBlur}
											onChangeText={(value) => onChange(value)}
										/>
									)}
									name="amperage"
									rules={{ required: true }}
									defaultValue=""
								/>
								<HelperText type="error" visible={errors.amperage}>
									{errors.amperage?.message}
								</HelperText>
							</View>
							<View style={{ width: '48%' }}>
								<Controller
									control={control}
									render={({ field: { onChange, onBlur, value } }) => (
										<TextInput
											keyboardType="numeric"
											label="Volts"
											value={value}
											maxLength={10}
											mode="outlined"
											onBlur={onBlur}
											onChangeText={(value) => onChange(value)}
										/>
									)}
									name="voltage"
									rules={{ required: true }}
									defaultValue=""
								/>
								<HelperText type="error" visible={errors.voltage}>
									{errors.voltage?.message}
								</HelperText>
							</View>
						</View>
					)}
					<View>
						<View
							style={{
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							{!settings?.totalEnergy ? (
								<View style={{ width: '48%' }}>
									<Controller
										control={control}
										render={({ field: { onChange, onBlur, value } }) => (
											<TextInput
												keyboardType="numeric"
												label={
													isDiameter
														? `Diameter (${settings?.lengthImperial ? 'in' : 'mm'})`
														: `Length (${settings?.lengthImperial ? 'in' : 'mm'})`
												}
												value={value}
												maxLength={10}
												mode="outlined"
												onBlur={onBlur}
												onChangeText={(value) => onChange(value)}
											/>
										)}
										name="length"
										rules={{ required: true }}
										defaultValue=""
									/>
									<HelperText type="error" visible={errors.length}>
										{errors.length?.message}
									</HelperText>
								</View>
							) : (
								<View style={{ width: '48%' }}>
									<Controller
										control={control}
										render={({ field: { onChange, onBlur, value } }) => (
											<TextInput
												keyboardType="numeric"
												label="Total energy (kJ)"
												value={value}
												maxLength={10}
												mode="outlined"
												onBlur={onBlur}
												onChangeText={(value) => onChange(value)}
											/>
										)}
										name="totalEnergy"
										rules={{ required: true }}
										defaultValue=""
									/>
									<HelperText type="error" visible={errors.totalEnergy}>
										{errors.totalEnergy?.message}
									</HelperText>
								</View>
							)}
							{!settings?.totalEnergy ? (
								<View style={{ width: '48%', position: 'relative' }}>
									<Controller
										control={control}
										render={({ field: { onChange, onBlur, value } }) => (
											<TextInput
												label="Time (sec)"
												value={value}
												maxLength={10}
												mode="outlined"
												onBlur={onBlur}
												onChangeText={(value) => onChange(value)}
											/>
										)}
										name="time"
										rules={{ required: true }}
										defaultValue=""
									/>
									<HelperText type="error" visible={errors.time}>
										{errors.time?.message}
									</HelperText>
									{(isRunning || ms > 0) && (
										<IconButton
											style={{
												position: 'absolute',
												right: 0,
												top: 6,
												zIndex: 2,
											}}
											iconColor="#ff9800"
											icon="stop"
											onPress={() => {
												resetStopwatch();
												setTime(0);
											}}
										/>
									)}
								</View>
							) : (
								<View style={{ width: '48%' }}>
									<Controller
										control={control}
										render={({ field: { onChange, onBlur, value } }) => (
											<TextInput
												keyboardType="numeric"
												label={`Length (${settings?.lengthImperial ? 'in' : 'mm'})`}
												value={value}
												maxLength={10}
												mode="outlined"
												onBlur={onBlur}
												onChangeText={(value) => onChange(value)}
											/>
										)}
										name="length"
										rules={{ required: true }}
										defaultValue=""
									/>
									<HelperText type="error" visible={errors.length}>
										{errors.length?.message}
									</HelperText>
								</View>
							)}
						</View>
					</View>
					{!settings?.totalEnergy && (
						<View
							style={{
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								paddingBottom: 30,
							}}
						>
							<Button
								style={{ width: '48%', height: 40, justifyContent: 'center' }}
								buttonColor="#ff9800"
								icon={isDiameter ? 'diameter-variant' : 'ruler'}
								mode="contained"
								onPress={() =>
									isDiameter ? setDiameter(false) : setDiameter(true)
								}
							>
								{isDiameter ? 'Diameter' : 'Length'}
							</Button>
							<Button
								style={{ width: '48%', height: 40, justifyContent: 'center' }}
								buttonColor="#ff9800"
								icon={isRunning ? 'pause' : ms > 0 ? 'play' : 'timer-outline'}
								mode="contained"
								onPress={handleStartStop}
							>
								{isRunning ? 'Pause' : ms > 0 ? 'Resume' : 'Measure'}
							</Button>
						</View>
					)}
					{settings?.customFields?.map((element) => (
						<Controller
							key={element.timestamp}
							control={control}
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									label={element.name}
									value={value}
									mode="outlined"
									style={{ paddingBottom: 5 }}
									onBlur={onBlur}
									onChangeText={(value) => onChange(value)}
								/>
							)}
							name={camelCase(element.name)}
							defaultValue=""
						/>
					))}
					{!settings?.totalEnergy && (
						<View
							style={{
								alignItems: 'center',
								marginTop:
									Platform.OS === 'android'
										? 20
										: settings?.customFields?.length > 0
											? -20
											: -45,
							}}
						>
							<Controller
								control={control}
								render={({ field: { onChange, onBlur, value } }) => (
									<Picker
										selectedValue={value}
										style={{ color: 'gray', width: '100%' }}
										itemStyle={{ color: 'gray' }}
										onValueChange={(value) => onChange(value)}
									>
										<Picker.Item
											label="Select efficiency factor"
											value={null}
										/>
										<Picker.Item label="0.6 - 141, 15" value="0.6" />
										<Picker.Item
											label="0.8 - 111, 114, 131, 135, 136, 138"
											value="0.8"
										/>
										<Picker.Item label="1 - 121" value="1" />
									</Picker>
								)}
								name="efficiencyFactor"
								rules={{ required: true }}
								defaultValue=""
							/>
							{errors.efficiencyFactor ? (
								<Text style={{ color: '#cf6679', textAlign: 'center' }}>
									Please select the efficiency factor
								</Text>
							) : null}
						</View>
					)}
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

export default HeatInputScreen;
