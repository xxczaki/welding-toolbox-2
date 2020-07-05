import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Keyboard, View, ScrollView} from 'react-native';
import {Picker} from '@react-native-community/picker';
import Clipboard from '@react-native-community/clipboard';
import {TextInput, Button, Text, HelperText, FAB as Fab, Card, Appbar} from 'react-native-paper';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers';
import {object, string} from 'yup';
import {heatInput} from 'welding-utils';
import sec from 'sec';
import storage from '../storage.js';

import {useStopwatch} from '../hooks/use-stopwatch';

const HeatInputScreen = ({navigation}) => {
	const [settings, setSettings] = useState({});
	const [result, setResult] = useState(0);
	const [isDiameter, setDiameter] = useState(false);
	const {ms, start, stop, resetStopwatch, isRunning} = useStopwatch();

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

	const {control, handleSubmit, errors, reset, setValue} = useForm({
		defaultValues: {
			amperage: '',
			voltage: '',
			length: '',
			time: '',
			efficiencyFactor: '',
			totalEnergy: ''
		},
		resolver: yupResolver(settings?.totalEnergy ? partialValidationSchema : fullValidationSchema)
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

	useEffect(() => {
		(async () => {
			const data = await storage.get('settings');

			await storage.set('settings', JSON.stringify({...JSON.parse(data), ...settings}));
		})();
	}, [settings]);

	useMemo(() => {
		if (isRunning) {
			setValue('time', new Date(ms).toISOString().slice(11, -5).toString());
		}
	}, [isRunning, ms, setValue]);

	const handleStartStop = () => {
		if (isRunning) {
			stop();
		} else {
			start();
		}
	};

	const toCamelCase = string_ => string_.replace(/^\w|[A-Z]|\b\w/g, (ltr, idx) => idx === 0 ? ltr.toLowerCase() : ltr.toUpperCase()).replace(/\s+/g, '');

	const onSubmit = _data => {
		Keyboard.dismiss();

		const standardFields = new Set([
			'amperage',
			'voltage',
			'length',
			'time',
			'efficiencyFactor',
			'totalEnergy'
		]);

		const keys = Object.keys(_data);
		const formattedValues = Object.values(_data).map((element, index) => {
			if (typeof element === 'string' && (element.includes(':') || !standardFields.has(keys[index]))) {
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

		const custom = settings?.customFields?.map(element => {
			const index = Object.keys(data).indexOf(toCamelCase(element.name));

			return {
				[element.name]: Object.values(data)[index]
			};
		});

		setSettings({...settings, resultHistory: [
			Object.assign({
				timestamp: Date.now().toString(),
				amperage: data.amperage,
				voltage: data.voltage,
				totalEnergy: data.totalEnergy,
				length: `${data.length} ${settings?.lengthImperial ? 'in' : 'mm'}`,
				time: sec((data.time).toString()),
				efficiencyFactor: data.efficiencyFactor,
				result: `${Math.round((result + Number.EPSILON) * 1000) / 1000} kJ/${settings?.resultUnit}`
			}, ...custom),
			...settings?.resultHistory
		]});
	};

	const resetForm = () => {
		reset();
		resetStopwatch();
		setResult(0);
	};

	return (
		<View style={{flex: 1}}>
			<Appbar.Header>
				<Appbar.Content title="Welding Toolbox 2"/>
				<Appbar.Action icon="delete" onPress={resetForm}/>
			</Appbar.Header>
			<ScrollView
				contentContainerStyle={{flexGrow: 1, backgroundColor: '#121212', padding: 20}}
				keyboardShouldPersistTaps="handled"
			>
				<Card style={{height: 100, width: '100%', marginBottom: 10}}>
					<Card.Title title={`Result: ${result} kJ/${settings?.resultUnit ?? 'mm'}`}/>
					<Card.Actions>
						<Button onPress={() => Clipboard.setString(`${result}`)}>Copy</Button>
						<Button onPress={() => navigation.navigate('History')}>History</Button>
					</Card.Actions>
				</Card>
				{!settings?.totalEnergy &&
					<View style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
						<View style={{width: '45%'}}>
							<Controller
								control={control}
								render={({onChange, onBlur, value}) => (
									<TextInput
										keyboardType="numeric"
										label="Amps"
										value={value}
										maxLength={10}
										onBlur={onBlur}
										onChangeText={value => onChange(value)}
									/>
								)}
								name="amperage"
								rules={{required: true}}
								defaultValue=""
							/>
							<HelperText
								type="error"
								visible={errors.amperage}
							>
								{errors.amperage}
							</HelperText>
						</View>
						<View style={{width: '45%'}}>
							<Controller
								control={control}
								render={({onChange, onBlur, value}) => (
									<TextInput
										keyboardType="numeric"
										label="Volts"
										value={value}
										maxLength={10}
										onBlur={onBlur}
										onChangeText={value => onChange(value)}
									/>
								)}
								name="voltage"
								rules={{required: true}}
								defaultValue=""
							/>
							<HelperText
								type="error"
								visible={errors.voltage}
							>
								{errors.voltage}
							</HelperText>
						</View>
					</View>}
				<View>
					<View style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
						{!settings?.totalEnergy ?
							<View style={{width: '45%'}}>
								<Controller
									control={control}
									render={({onChange, onBlur, value}) => (
										<TextInput
											keyboardType="numeric"
											label={isDiameter ? `Diameter (${settings?.lengthImperial ? 'in' : 'mm'})` : `Length (${settings?.lengthImperial ? 'in' : 'mm'})`}
											value={value}
											maxLength={10}
											onBlur={onBlur}
											onChangeText={value => onChange(value)}
										/>
									)}
									name="length"
									rules={{required: true}}
									defaultValue=""
								/>
								<HelperText
									type="error"
									visible={errors.length}
								>
									{errors.length}
								</HelperText>
							</View> :
							<View style={{width: '45%'}}>
								<Controller
									control={control}
									render={({onChange, onBlur, value}) => (
										<TextInput
											keyboardType="numeric"
											label="Total energy (kJ)"
											value={value}
											maxLength={10}
											onBlur={onBlur}
											onChangeText={value => onChange(value)}
										/>
									)}
									name="totalEnergy"
									rules={{required: true}}
									defaultValue=""
								/>
								<HelperText
									type="error"
									visible={errors.totalEnergy}
								>
									{errors.totalEnergy}
								</HelperText>
							</View>}
						{!settings?.totalEnergy ?
							<View style={{width: '45%'}}>
								<Controller
									control={control}
									render={({onChange, onBlur, value}) => (
										<TextInput
											label="Time (sec)"
											value={value}
											maxLength={10}
											onBlur={onBlur}
											onChangeText={value => onChange(value)}
										/>
									)}
									name="time"
									rules={{required: true}}
									defaultValue=""
								/>
								<HelperText
									type="error"
									visible={errors.time}
								>
									{errors.time}
								</HelperText>
							</View> :
							<View style={{width: '45%'}}>
								<Controller
									control={control}
									render={({onChange, onBlur, value}) => (
										<TextInput
											keyboardType="numeric"
											label={`Length (${settings?.lengthImperial ? 'in' : 'mm'})`}
											value={value}
											maxLength={10}
											onBlur={onBlur}
											onChangeText={value => onChange(value)}
										/>
									)}
									name="length"
									rules={{required: true}}
									defaultValue=""
								/>
								<HelperText
									type="error"
									visible={errors.length}
								>
									{errors.length}
								</HelperText>
							</View>}
					</View>
				</View>
				{!settings?.totalEnergy &&
					<View style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
						<Button
							style={{width: '45%'}}
							color="#ff9800"
							icon={isDiameter ? 'diameter-variant' : 'ruler'}
							mode="contained"
							onPress={() => isDiameter ? setDiameter(false) : setDiameter(true)}
						>
							{isDiameter ? 'Diameter' : 'Length'}
						</Button>

						<Button
							style={{width: '45%'}}
							color="#ff9800"
							icon={isRunning ? 'pause' : (ms !== 0 ? 'play' : 'timer-outline')}
							mode="contained"
							onPress={handleStartStop}
						>
							{isRunning ? 'Pause' : (ms !== 0 ? 'Resume' : 'Measure')}
						</Button>

					</View>}
				{settings?.customFields?.map(element => (
					<Controller
						key={element.timestamp}
						control={control}
						render={({onChange, onBlur, value}) => (
							<TextInput
								label={element.name}
								value={value}
								onBlur={onBlur}
								onChangeText={value => onChange(value)}
							/>
						)}
						name={toCamelCase(element.name)}
						defaultValue=""
					/>
				))}
				{!settings?.totalEnergy &&
					<View style={{alignItems: 'center', paddingTop: 20, paddingBottom: 80}}>
						<Controller
							control={control}
							render={({onChange, value}) => (
								<Picker
									selectedValue={value}
									style={{color: 'gray', width: '80%'}}
									onValueChange={value => onChange(value)}
								>
									<Picker.Item label="Select efficiency factor" value={null}/>
									<Picker.Item label="0.6 - 141, 15" value="0.6"/>
									<Picker.Item label="0.8 - 111, 114, 131, 135, 136, 138" value="0.8"/>
									<Picker.Item label="1 - 121" value="1"/>
								</Picker>
							)}
							name="efficiencyFactor"
							rules={{required: true}}
							defaultValue=""
						/>
						{errors.efficiencyFactor ? <Text style={{color: '#cf6679', textAlign: 'center'}}>Please select the efficiency factor</Text> : null}
					</View>}
			</ScrollView>
			<Fab
				style={{position: 'absolute', right: 20, bottom: 20, backgroundColor: '#4caf50'}}
				color="#000"
				icon="check"
				label="Calculate"
				onPress={handleSubmit(onSubmit)}
			/>
		</View>
	);
};

export default HeatInputScreen;
