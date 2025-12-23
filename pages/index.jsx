import React, { useState } from 'react';

export default function RaceNutritionCalculator() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    raceType: '',
    gender: '',
    weight: '',
    height: '',
    sweatType: '',
    avgTemp: '',
    windCondition: '',
    humidity: '',
    sunExposure: ''
  });
  const [results, setResults] = useState(null);

  const colors = {
    primary: '#D62027',
    charcoal: '#231F20',
    maroon: '#600D0D',
    light: '#F4F4F9'
  };

  const raceTypes = {
    'Sprint Triathlon': { distance: 'Sprint Distance', duration: 1.5, swim: '0.5 mi', bike: '12.4 mi', run: '3.1 mi', type: 'triathlon' },
    'Olympic Triathlon': { distance: 'Olympic Distance', duration: 3, swim: '0.93 mi', bike: '24.8 mi', run: '6.2 mi', type: 'triathlon' },
    'Half Ironman (70.3)': { distance: '70.3 Miles', duration: 6, swim: '1.2 mi', bike: '56 mi', run: '13.1 mi', type: 'triathlon' },
    'Full Ironman (140.6)': { distance: '140.6 Miles', duration: 12, swim: '2.4 mi', bike: '112 mi', run: '26.2 mi', type: 'triathlon' },
    '5K Run': { distance: '5K (3.1 miles)', duration: 0.5, type: 'run' },
    '10K Run': { distance: '10K (6.2 miles)', duration: 1, type: 'run' },
    'Half Marathon': { distance: '13.1 Miles', duration: 2.5, type: 'run' },
    'Full Marathon': { distance: '26.2 Miles', duration: 4.5, type: 'run' }
  };

  const sweatTypes = {
    'Dry': { label: 'Dry Sweater', description: 'Minimal sweat, stay relatively dry', multiplier: 0.7 },
    'Light': { label: 'Light Sweater', description: 'Light perspiration, small sweat patches', multiplier: 0.85 },
    'Medium': { label: 'Average Sweater', description: 'Moderate sweating, visible perspiration', multiplier: 1.0 },
    'Heavy': { label: 'Heavy Sweater', description: 'Heavy sweating, soaked clothing', multiplier: 1.3 },
    'Excessive': { label: 'Excessive Sweater', description: 'Profuse sweating, dripping constantly', multiplier: 1.6 }
  };

  const windConditions = {
    'Still': { label: 'Still/Calm', description: 'No wind, air feels stagnant', multiplier: 1.2 },
    'Light': { label: 'Light Breeze', description: 'Gentle wind, noticeable but mild', multiplier: 1.0 },
    'Windy': { label: 'Windy', description: 'Strong winds, significant air movement', multiplier: 0.85 }
  };

  const humidityLevels = {
    'Dry': { label: 'Dry', description: 'Low humidity, sweat evaporates quickly', multiplier: 0.9 },
    'Humid': { label: 'Humid', description: 'Moderate humidity, some difficulty cooling', multiplier: 1.1 },
    'Muggy': { label: 'Muggy', description: 'High humidity, sweat doesn\'t evaporate easily', multiplier: 1.3 }
  };

  const sunExposureLevels = {
    'Overcast': { label: 'Overcast/Cloudy', description: 'No direct sun, cloud cover', multiplier: 0.9 },
    'Partly': { label: 'Partly Sunny/Cloudy', description: 'Mix of sun and clouds', multiplier: 1.0 },
    'Sunny': { label: 'Sunny', description: 'Clear skies, direct sunlight', multiplier: 1.2 },
    'Tropical': { label: 'Tropical/Intense Sun', description: 'Extreme sun exposure, high UV', multiplier: 1.3 }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateNutrition = () => {
    const weightLbs = parseFloat(formData.weight);
    const weightKg = weightLbs * 0.453592;
    const race = raceTypes[formData.raceType];
    const duration = race.duration;

    // Base calculations (same as before)
    const taperCarbsPerDay = duration > 2 ? Math.round(weightKg * 10) : Math.round(weightKg * 5);
    const taperProteinPerDay = Math.round(weightKg * 1.6);
    const taperFatPerDay = Math.round(weightKg * 1.0);
    const taperCalories = (taperCarbsPerDay * 4) + (taperProteinPerDay * 4) + (taperFatPerDay * 9);

    const preMealCarbs = Math.round(weightKg * (duration > 2 ? 3 : 2));
    const preMealProtein = Math.round(weightKg * 0.3);
    const preMealCalories = (preMealCarbs * 4) + (preMealProtein * 4);
    const preMealTiming = duration > 2 ? '3-4 hours' : '2-3 hours';
    const preStartCarbs = duration > 1 ? 30 : 20;

    let carbsPerHour;
    if (duration < 1) carbsPerHour = 0;
    else if (duration < 2.5) carbsPerHour = 40;
    else if (duration < 5) carbsPerHour = 60;
    else carbsPerHour = 75;
    
    const totalRaceCarbs = Math.round(carbsPerHour * duration);
    
    // UPDATED: Environmental-adjusted hydration and sodium
    const baseFluid = formData.gender === 'male' ? 24 : 20; // oz per hour
    const baseSodium = duration > 2 ? 600 : 400; // mg per hour

    // Calculate multipliers from environmental conditions
    const sweatMultiplier = sweatTypes[formData.sweatType]?.multiplier || 1.0;
    
    // Temperature adjustment
    const temp = parseFloat(formData.avgTemp) || 70;
    let tempMultiplier = 1.0;
    if (temp < 60) tempMultiplier = 0.8;
    else if (temp >= 60 && temp < 70) tempMultiplier = 1.0;
    else if (temp >= 70 && temp < 80) tempMultiplier = 1.2;
    else if (temp >= 80 && temp < 90) tempMultiplier = 1.4;
    else tempMultiplier = 1.6;

    const windMultiplier = windConditions[formData.windCondition]?.multiplier || 1.0;
    const humidityMultiplier = humidityLevels[formData.humidity]?.multiplier || 1.0;
    const sunMultiplier = sunExposureLevels[formData.sunExposure]?.multiplier || 1.0;

    // Combined multiplier for fluid and sodium needs
    const environmentalMultiplier = sweatMultiplier * tempMultiplier * windMultiplier * humidityMultiplier * sunMultiplier;

    const fluidPerHour = Math.round(baseFluid * environmentalMultiplier);
    const sodiumPerHour = Math.round(baseSodium * environmentalMultiplier);
    const totalFluid = Math.round(fluidPerHour * duration);

    const caffeineDose = duration > 2 ? Math.round(weightKg * 4) : 0;

    const recoveryCarbs = Math.round(weightKg * 1.2);
    const recoveryProtein = Math.round(weightKg * 0.4);
    const recoveryCalories = (recoveryCarbs * 4) + (recoveryProtein * 4);
    const followUpCarbs = Math.round(weightKg * 1.0);
    const followUpProtein = Math.round(weightKg * 0.3);
    const followUpFat = Math.round(weightKg * 0.3);

    setResults({
      weightKg,
      duration,
      raceDistance: race.distance,
      raceBreakdown: race.type === 'triathlon' ? `${race.swim} swim, ${race.bike} bike, ${race.run} run` : race.distance,
      taper: { carbsPerDay: taperCarbsPerDay, proteinPerDay: taperProteinPerDay, fatPerDay: taperFatPerDay, caloriesPerDay: taperCalories, needsCarboLoading: duration > 2 },
      raceMorning: { mealTiming: preMealTiming, carbs: preMealCarbs, protein: preMealProtein, calories: preMealCalories, preStartCarbs: preStartCarbs, caffeine: caffeineDose },
      duringRace: { 
        carbsPerHour: carbsPerHour, 
        totalCarbs: totalRaceCarbs, 
        fluidPerHour: fluidPerHour, 
        totalFluid: totalFluid, 
        sodiumPerHour: sodiumPerHour, 
        needsFueling: duration >= 1, 
        fuelingStrategy: duration < 1 ? 'none' : duration < 2.5 ? 'moderate' : 'high',
        environmentalMultiplier: environmentalMultiplier.toFixed(2),
        sweatType: sweatTypes[formData.sweatType]?.label,
        conditions: {
          temp: formData.avgTemp,
          wind: windConditions[formData.windCondition]?.label,
          humidity: humidityLevels[formData.humidity]?.label,
          sun: sunExposureLevels[formData.sunExposure]?.label
        }
      },
      recovery: { immediateCarbs: recoveryCarbs, immediateProtein: recoveryProtein, immediateCalories: recoveryCalories, followUpCarbs: followUpCarbs, followUpProtein: followUpProtein, followUpFat: followUpFat }
    });
  };

  const nextStep = () => {
    if (step === 4) calculateNutrition();
    setStep(step + 1);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const prevStep = () => {
    setStep(step - 1);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const startOver = () => {
    setStep(1);
    setFormData({ raceType: '', gender: '', weight: '', height: '', sweatType: '', avgTemp: '', windCondition: '', humidity: '', sunExposure: '' });
    setResults(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${colors.maroon} 0%, ${colors.charcoal} 100%)`, fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { overflow-x: hidden; max-width: 100vw; }
        .card-enter { animation: slideIn 0.5s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .result-card { padding: 12px !important; margin: 0 !important; }
          h1 { font-size: 32px !important; }
          h2 { font-size: 20px !important; }
          button { font-size: 14px !important; padding: 12px 6px !important; letter-spacing: 0.3px !important; }
        }
        @media (max-width: 400px) {
          h1 { font-size: 26px !important; }
          h2 { font-size: 18px !important; }
          button { font-size: 12px !important; padding: 10px 4px !important; letter-spacing: 0.2px !important; }
          .result-card { padding: 10px !important; }
        }
        @media (max-width: 375px) {
          button { font-size: 11px !important; padding: 8px 3px !important; letter-spacing: 0px !important; }
          h1 { font-size: 24px !important; }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '72px', fontWeight: '900', color: colors.primary, letterSpacing: '2px', marginBottom: '8px', textShadow: '0 4px 12px rgba(214, 32, 39, 0.5)' }}>KEYSTONE</div>
          <div style={{ fontSize: '24px', fontWeight: '300', color: 'white', letterSpacing: '8px' }}>ENDURANCE</div>
          <div style={{ height: '3px', width: '120px', background: colors.primary, margin: '20px auto' }} />
          <div style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginTop: '20px' }}>Race-Day Nutrition Calculator</div>
          <div style={{ fontSize: '16px', color: 'white', opacity: 0.8, marginTop: '10px' }}>Science-Based Fueling Strategy for Your Race</div>
        </div>

        {/* Step 1: Race Type */}
        {step === 1 && (
          <div className="card-enter" style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: `3px solid ${colors.primary}` }}>
              <h2 style={{ fontSize: '28px', marginBottom: '30px', color: colors.charcoal, fontWeight: '700' }}>STEP 1: SELECT YOUR RACE</h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {Object.keys(raceTypes).map(race => (
                  <div key={race} onClick={() => updateFormData('raceType', race)} style={{ padding: '20px', border: `3px solid ${formData.raceType === race ? colors.primary : '#ddd'}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: formData.raceType === race ? `${colors.primary}10` : 'white', boxShadow: formData.raceType === race ? `0 4px 12px ${colors.primary}40` : '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontWeight: '700', fontSize: '20px', color: colors.charcoal, marginBottom: '5px' }}>{race}</div>
                    <div style={{ fontSize: '15px', color: '#666' }}>{raceTypes[race].distance}{raceTypes[race].type === 'triathlon' && <span> • {raceTypes[race].swim} / {raceTypes[race].bike} / {raceTypes[race].run}</span>}</div>
                  </div>
                ))}
              </div>
              <button onClick={nextStep} disabled={!formData.raceType} style={{ width: '100%', marginTop: '30px', padding: '18px', fontSize: '20px', fontWeight: 'bold', background: formData.raceType ? colors.primary : '#cccccc', color: 'white', border: 'none', borderRadius: '12px', cursor: formData.raceType ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: formData.raceType ? `0 6px 20px ${colors.primary}60` : 'none', letterSpacing: '1px' }}>CONTINUE →</button>
            </div>
          </div>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <div className="card-enter" style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: `3px solid ${colors.primary}` }}>
              <h2 style={{ fontSize: '28px', marginBottom: '30px', color: colors.charcoal, fontWeight: '700' }}>STEP 2: SELECT GENDER</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {['Male', 'Female'].map(gender => (
                  <div key={gender} onClick={() => updateFormData('gender', gender.toLowerCase())} style={{ padding: '40px 20px', border: `3px solid ${formData.gender === gender.toLowerCase() ? colors.primary : '#ddd'}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', background: formData.gender === gender.toLowerCase() ? `${colors.primary}10` : 'white', textAlign: 'center', boxShadow: formData.gender === gender.toLowerCase() ? `0 4px 12px ${colors.primary}40` : '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontWeight: '700', fontSize: '24px', color: colors.charcoal }}>{gender}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '18px', fontSize: '18px', fontWeight: 'bold', background: 'white', color: colors.charcoal, border: `2px solid ${colors.charcoal}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>← BACK</button>
                <button onClick={nextStep} disabled={!formData.gender} style={{ flex: 2, padding: '18px', fontSize: '20px', fontWeight: 'bold', background: formData.gender ? colors.primary : '#cccccc', color: 'white', border: 'none', borderRadius: '12px', cursor: formData.gender ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: formData.gender ? `0 6px 20px ${colors.primary}60` : 'none', letterSpacing: '1px', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>CONTINUE →</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Body Stats */}
        {step === 3 && (
          <div className="card-enter" style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: `3px solid ${colors.primary}` }}>
              <h2 style={{ fontSize: '28px', marginBottom: '30px', color: colors.charcoal, fontWeight: '700' }}>STEP 3: ENTER BODY STATS</h2>
              <div style={{ display: 'grid', gap: '25px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: colors.charcoal, marginBottom: '10px' }}>Current Weight (lbs)</label>
                  <input type="number" value={formData.weight} onChange={(e) => updateFormData('weight', e.target.value)} placeholder="Enter weight in pounds" style={{ width: '100%', padding: '15px', fontSize: '18px', border: `2px solid #ddd`, borderRadius: '8px', fontFamily: 'Inter, sans-serif' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: colors.charcoal, marginBottom: '10px' }}>Height (inches)</label>
                  <input type="number" value={formData.height} onChange={(e) => updateFormData('height', e.target.value)} placeholder="Enter height in inches" style={{ width: '100%', padding: '15px', fontSize: '18px', border: `2px solid #ddd`, borderRadius: '8px', fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '18px', fontSize: '18px', fontWeight: 'bold', background: 'white', color: colors.charcoal, border: `2px solid ${colors.charcoal}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>← BACK</button>
                <button onClick={nextStep} disabled={!formData.weight || !formData.height} style={{ flex: 2, padding: '18px', fontSize: '20px', fontWeight: 'bold', background: (formData.weight && formData.height) ? colors.primary : '#cccccc', color: 'white', border: 'none', borderRadius: '12px', cursor: (formData.weight && formData.height) ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: (formData.weight && formData.height) ? `0 6px 20px ${colors.primary}60` : 'none', letterSpacing: '1px', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>CONTINUE →</button>
              </div>
            </div>
          </div>
        )}

        {/* NEW Step 4: Environmental Conditions */}
        {step === 4 && (
          <div className="card-enter" style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: `3px solid ${colors.primary}` }}>
              <h2 style={{ fontSize: '28px', marginBottom: '15px', color: colors.charcoal, fontWeight: '700' }}>STEP 4: TRAINING ENVIRONMENT</h2>
              <p style={{ fontSize: '15px', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                Help us personalize your hydration and sodium needs based on your typical training conditions.
              </p>

              <div style={{ display: 'grid', gap: '30px' }}>
                {/* Sweat Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: colors.charcoal, marginBottom: '15px' }}>
                    Sweat Type
                  </label>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.keys(sweatTypes).map(type => (
                      <div
                        key={type}
                        onClick={() => updateFormData('sweatType', type)}
                        style={{
                          padding: '15px',
                          border: `2px solid ${formData.sweatType === type ? colors.primary : '#ddd'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: formData.sweatType === type ? `${colors.primary}10` : 'white'
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '16px', color: colors.charcoal, marginBottom: '3px' }}>
                          {sweatTypes[type].label}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {sweatTypes[type].description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Average Training Temperature */}
                <div>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: colors.charcoal, marginBottom: '10px' }}>
                    Average Training Temperature (°F)
                  </label>
                  <input
                    type="number"
                    value={formData.avgTemp}
                    onChange={(e) => updateFormData('avgTemp', e.target.value)}
                    placeholder="e.g., 75"
                    style={{
                      width: '100%',
                      padding: '15px',
                      fontSize: '18px',
                      border: `2px solid #ddd`,
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>

                {/* Wind Conditions */}
                <div>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: colors.charcoal, marginBottom: '15px' }}>
                    Typical Wind Conditions
                  </label>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.keys(windConditions).map(wind => (
                      <div
                        key={wind}
                        onClick={() => updateFormData('windCondition', wind)}
                        style={{
                          padding: '15px',
                          border: `2px solid ${formData.windCondition === wind ? colors.primary : '#ddd'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: formData.windCondition === wind ? `${colors.primary}10` : 'white'
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '16px', color: colors.charcoal, marginBottom: '3px' }}>
                          {windConditions[wind].label}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {windConditions[wind].description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Humidity */}
                <div>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: colors.charcoal, marginBottom: '15px' }}>
                    Typical Humidity Level
                  </label>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.keys(humidityLevels).map(humidity => (
                      <div
                        key={humidity}
                        onClick={() => updateFormData('humidity', humidity)}
                        style={{
                          padding: '15px',
                          border: `2px solid ${formData.humidity === humidity ? colors.primary : '#ddd'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: formData.humidity === humidity ? `${colors.primary}10` : 'white'
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '16px', color: colors.charcoal, marginBottom: '3px' }}>
                          {humidityLevels[humidity].label}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {humidityLevels[humidity].description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sun Exposure */}
                <div>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: colors.charcoal, marginBottom: '15px' }}>
                    Typical Sun Exposure
                  </label>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.keys(sunExposureLevels).map(sun => (
                      <div
                        key={sun}
                        onClick={() => updateFormData('sunExposure', sun)}
                        style={{
                          padding: '15px',
                          border: `2px solid ${formData.sunExposure === sun ? colors.primary : '#ddd'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: formData.sunExposure === sun ? `${colors.primary}10` : 'white'
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '16px', color: colors.charcoal, marginBottom: '3px' }}>
                          {sunExposureLevels[sun].label}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {sunExposureLevels[sun].description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button onClick={prevStep} style={{ flex: 1, padding: '18px', fontSize: '18px', fontWeight: 'bold', background: 'white', color: colors.charcoal, border: `2px solid ${colors.charcoal}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>← BACK</button>
                <button onClick={nextStep} disabled={!formData.sweatType || !formData.avgTemp || !formData.windCondition || !formData.humidity || !formData.sunExposure} style={{ flex: 2, padding: '18px', fontSize: '20px', fontWeight: 'bold', background: (formData.sweatType && formData.avgTemp && formData.windCondition && formData.humidity && formData.sunExposure) ? colors.primary : '#cccccc', color: 'white', border: 'none', borderRadius: '12px', cursor: (formData.sweatType && formData.avgTemp && formData.windCondition && formData.humidity && formData.sunExposure) ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: (formData.sweatType && formData.avgTemp && formData.windCondition && formData.humidity && formData.sunExposure) ? `0 6px 20px ${colors.primary}60` : 'none', letterSpacing: '1px', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>GET MY PLAN →</button>
              </div>
            </div>
          </div>
        )}
{/* Step 5: Results - COMPLETE WITH ENVIRONMENTAL CONDITIONS */}
{step === 5 && results && (
  <div className="card-enter" style={{ width: '100%', maxWidth: '100%', padding: '0', margin: '0' }}>
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      border: `3px solid ${colors.primary}`,
      width: '100%',
      boxSizing: 'border-box',
      maxWidth: '100%'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '36px'
      }}>
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 12px 0',
          color: colors.charcoal,
          letterSpacing: '1px',
          fontWeight: '800'
        }}>
          YOUR RACE NUTRITION PLAN
        </h1>
        <p style={{
          fontSize: '20px',
          color: colors.charcoal,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          marginBottom: '10px'
        }}>
          {formData.raceType}
        </p>
        <p style={{
          fontSize: '16px',
          color: '#666',
          fontFamily: 'Inter, sans-serif'
        }}>
          {results.raceBreakdown}
        </p>
      </div>

      {/* RACE-DAY CONDITIONS DISCLAIMER */}
      <div style={{
        marginBottom: '40px',
        padding: '25px',
        background: '#FFF3CD',
        borderRadius: '12px',
        border: '2px solid #FFC107',
        lineHeight: '1.8'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#856404',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          IMPORTANT: Race-Day Conditions
        </div>
        <p style={{ fontSize: '15px', color: '#856404', marginBottom: '10px' }}>
          This plan is based on your typical training environment. <strong>Actual race-day conditions may differ significantly.</strong>
        </p>
        <p style={{ fontSize: '15px', color: '#856404', marginBottom: '10px' }}>
          Factors like temperature, humidity, dew point, wind, and rain can dramatically affect your hydration and fueling needs:
        </p>
        <ul style={{ fontSize: '14px', color: '#856404', marginLeft: '20px', marginBottom: '10px' }}>
          <li>Cooler temps = Less sweat, reduced fluid/sodium needs</li>
          <li>Hotter temps = More sweat, increased fluid/sodium needs</li>
          <li>High humidity = Reduced sweat evaporation, higher sweat rate</li>
          <li>Strong wind = Better cooling, potentially lower fluid needs</li>
          <li>Rain = Natural cooling, adjust hydration accordingly</li>
        </ul>
        <p style={{ fontSize: '15px', color: '#856404', fontWeight: '600' }}>
          📞 <strong>Check with your coach</strong> to adjust this plan based on forecasted race-day conditions.
        </p>
      </div>

      {/* YOUR TRAINING ENVIRONMENT SUMMARY */}
      <div style={{
        marginBottom: '40px',
        padding: '25px',
        background: `${colors.charcoal}08`,
        borderRadius: '12px',
        border: `2px solid ${colors.charcoal}30`
      }}>
        <h3 style={{
          fontSize: '22px',
          color: colors.charcoal,
          marginBottom: '20px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          YOUR TRAINING ENVIRONMENT
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '15px'
        }}>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ddd'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
              Sweat Type
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: colors.charcoal }}>
              {results.duringRace.sweatType}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ddd'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
              Avg Temp
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: colors.charcoal }}>
              {results.duringRace.conditions.temp}°F
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ddd'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
              Wind
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: colors.charcoal }}>
              {results.duringRace.conditions.wind}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ddd'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
              Humidity
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: colors.charcoal }}>
              {results.duringRace.conditions.humidity}
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px solid #ddd'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '600' }}>
              Sun Exposure
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: colors.charcoal }}>
              {results.duringRace.conditions.sun}
            </div>
          </div>
        </div>
        <div style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666',
          marginTop: '10px'
        }}>
          Environmental multiplier applied: <strong>{results.duringRace.environmentalMultiplier}x</strong>
        </div>
      </div>

      {/* PHASE 1: Taper Nutrition (3 Days Out) */}
      <div style={{
        marginBottom: '40px',
        padding: '30px',
        background: `${colors.primary}08`,
        borderRadius: '12px',
        border: `2px solid ${colors.primary}30`
      }}>
        <h2 style={{
          fontSize: '28px',
          color: colors.primary,
          marginBottom: '20px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          TAPER NUTRITION (3 DAYS BEFORE)
        </h2>
        
        {results.taper.needsCarboLoading && (
          <div style={{
            background: colors.primary,
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ⚡ CARB LOADING RECOMMENDED FOR THIS DISTANCE
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.primary}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Daily Carbs
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
              {results.taper.carbsPerDay}g
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.primary}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Daily Protein
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
              {results.taper.proteinPerDay}g
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.primary}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Daily Fat
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
              {results.taper.fatPerDay}g
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.primary}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Daily Calories
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
              {results.taper.caloriesPerDay}
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          lineHeight: '1.8',
          color: colors.charcoal
        }}>
          <p style={{ marginBottom: '15px', fontWeight: '600', fontSize: '16px' }}>
            <strong>Carb Loading Strategy:</strong>
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Focus on easily digestible carbs: pasta, rice, potatoes, bread, oatmeal
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Reduce fiber intake to minimize GI distress on race day
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Maintain hydration: drink to thirst plus extra 16-20 oz daily
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Reduce training volume (taper) while increasing carb intake
          </p>
          <p>
            • Avoid trying new foods - stick with what you know works
          </p>
        </div>
      </div>

      {/* PHASE 2: Race Morning Nutrition */}
      <div style={{
        marginBottom: '40px',
        padding: '30px',
        background: `${colors.maroon}15`,
        borderRadius: '12px',
        border: `2px solid ${colors.maroon}50`
      }}>
        <h2 style={{
          fontSize: '28px',
          color: colors.maroon,
          marginBottom: '20px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          RACE MORNING NUTRITION
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.maroon}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Meal Timing
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: colors.maroon }}>
              {results.raceMorning.mealTiming}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
              before race start
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.maroon}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Pre-Race Carbs
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.maroon }}>
              {results.raceMorning.carbs}g
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.maroon}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Protein
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.maroon }}>
              {results.raceMorning.protein}g
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.maroon}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Calories
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.maroon }}>
              {results.raceMorning.calories}
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          lineHeight: '1.8',
          color: colors.charcoal,
          marginBottom: '20px'
        }}>
          <p style={{ marginBottom: '15px', fontWeight: '600', fontSize: '16px' }}>
            <strong>Pre-Race Meal Ideas:</strong>
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Oatmeal with banana, honey, and a scoop of protein powder
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Bagel with peanut butter and jelly, plus a banana
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Toast with almond butter and sliced banana
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Sports drink or smoothie with banana and protein powder
          </p>
          <p>
            • White rice with scrambled eggs and toast
          </p>
        </div>

        <div style={{
          background: colors.maroon,
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          lineHeight: '1.8'
        }}>
          <p style={{ marginBottom: '15px', fontWeight: '700', fontSize: '16px' }}>
            30-60 MINUTES BEFORE START:
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Consume {results.raceMorning.preStartCarbs}g quick carbs (energy gel, sports drink, or banana)
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Sip 8-16 oz of water or sports drink
          </p>
          {results.raceMorning.caffeine > 0 && (
            <p>
              • Optional: {results.raceMorning.caffeine}mg caffeine for performance boost (coffee, gel, or pre-workout)
            </p>
          )}
        </div>
      </div>

      {/* PHASE 3: During-Race Fueling */}
      <div style={{
        marginBottom: '40px',
        padding: '30px',
        background: `${colors.primary}12`,
        borderRadius: '12px',
        border: `2px solid ${colors.primary}40`
      }}>
        <h2 style={{
          fontSize: '28px',
          color: colors.primary,
          marginBottom: '20px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          DURING-RACE FUELING
        </h2>

        {!results.duringRace.needsFueling ? (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '18px',
            color: colors.charcoal,
            border: `2px solid ${colors.primary}`
          }}>
            <p style={{ fontWeight: '600', marginBottom: '15px', fontSize: '20px', color: colors.primary }}>
              ✓ NO IN-RACE FUELING NEEDED
            </p>
            <p style={{ marginBottom: '10px' }}>
              For this race duration, rely on your pre-race nutrition.
            </p>
            <p>
              Focus on hydration only - sip water if available at aid stations.
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
              maxWidth: '100%',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: `2px solid ${colors.primary}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                  Carbs Per Hour
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
                  {results.duringRace.carbsPerHour}g
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: `2px solid ${colors.primary}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                  Total Race Carbs
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
                  {results.duringRace.totalCarbs}g
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: `2px solid ${colors.primary}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                  Fluid Per Hour
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
                  {results.duringRace.fluidPerHour} oz
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Adjusted for conditions
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: `2px solid ${colors.primary}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                  Sodium Per Hour
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
                  {results.duringRace.sodiumPerHour}mg
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Adjusted for conditions
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              lineHeight: '1.8',
              color: colors.charcoal
            }}>
              <p style={{ marginBottom: '15px', fontWeight: '600', fontSize: '16px' }}>
                <strong>Fueling Strategy:</strong>
              </p>
              <p style={{ marginBottom: '10px' }}>
                • Use energy gels, chews, sports drinks, or real food to hit carb targets
              </p>
              <p style={{ marginBottom: '10px' }}>
                • Take nutrition every 15-20 minutes (don't wait until you're hungry!)
              </p>
              <p style={{ marginBottom: '10px' }}>
                • Start fueling early - by 30-45 minutes into the race
              </p>
              <p style={{ marginBottom: '10px' }}>
                • Alternate between solid and liquid carbs to avoid GI issues
              </p>
              <p style={{ marginBottom: '10px' }}>
                • <strong>ALWAYS practice your race-day fueling strategy in training</strong>
              </p>
              <p style={{ marginBottom: '10px' }}>
                • Use electrolyte drinks or salt tabs to maintain sodium levels
              </p>
              <p>
                • Drink to thirst - don't over or under hydrate
              </p>
            </div>
          </>
        )}
      </div>

      {/* PHASE 4: Post-Race Recovery */}
      <div style={{
        marginBottom: '40px',
        padding: '30px',
        background: `${colors.maroon}18`,
        borderRadius: '12px',
        border: `2px solid ${colors.maroon}60`
      }}>
        <h2 style={{
          fontSize: '28px',
          color: colors.maroon,
          marginBottom: '20px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          POST-RACE RECOVERY
        </h2>

        <div style={{
          background: colors.maroon,
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: '600',
          textAlign: 'center',
          fontSize: '16px'
        }}>
          ⏱ RECOVERY WINDOW: WITHIN 30 MINUTES OF FINISHING
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.maroon}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Immediate Carbs
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.maroon }}>
              {results.recovery.immediateCarbs}g
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.maroon}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Immediate Protein
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.maroon }}>
              {results.recovery.immediateProtein}g
            </div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${colors.maroon}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Calories
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: colors.maroon }}>
              {results.recovery.immediateCalories}
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          lineHeight: '1.8',
          color: colors.charcoal,
          marginBottom: '20px'
        }}>
          <p style={{ marginBottom: '15px', fontWeight: '600', fontSize: '16px' }}>
            <strong>Immediate Recovery (0-30 minutes):</strong>
          </p>
          <p style={{ marginBottom: '10px' }}>
            • <strong>Chocolate milk</strong> - ideal 3:1 carb to protein ratio
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Recovery shake with fruit and protein powder
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Banana with protein shake or Greek yogurt
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Sports recovery drink + protein bar
          </p>
          <p>
            • PB&J sandwich with chocolate milk
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          lineHeight: '1.8',
          color: colors.charcoal
        }}>
          <p style={{ marginBottom: '15px', fontWeight: '600', fontSize: '16px' }}>
            <strong>Follow-Up Meal (2 hours later):</strong>
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Full meal with {results.recovery.followUpCarbs}g carbs, {results.recovery.followUpProtein}g protein, {results.recovery.followUpFat}g fat
          </p>
          <p style={{ marginBottom: '10px' }}>
            • <strong>Examples:</strong> Pasta with grilled chicken, rice bowl with salmon, turkey sandwich with chips and fruit
          </p>
          <p style={{ marginBottom: '10px' }}>
            • Include vegetables for micronutrients and antioxidants
          </p>
          <p>
            • Continue hydrating with water and electrolytes throughout the day
          </p>
        </div>
      </div>

      {/* Scientific References */}
      <div style={{
        padding: '30px',
        background: '#f8f8f8',
        borderRadius: '12px',
        border: '2px solid #ddd',
        marginBottom: '30px'
      }}>
        <h3 style={{
          fontSize: '20px',
          color: colors.charcoal,
          marginBottom: '20px',
          fontWeight: '700',
          textAlign: 'center'
        }}>
          SCIENTIFIC REFERENCES
        </h3>
        <div style={{
          fontSize: '13px',
          lineHeight: '1.8',
          color: '#555'
        }}>
          <p style={{ marginBottom: '12px' }}>
            <strong>Burke, L. M., et al. (2011).</strong> Carbohydrates for training and competition. <em>Journal of Sports Sciences, 29</em>(sup1), S17-S27.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Thomas, D. T., et al. (2016).</strong> Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the American College of Sports Medicine: Nutrition and Athletic Performance. <em>Journal of the Academy of Nutrition and Dietetics, 116</em>(3), 501-528.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Jeukendrup, A. E. (2014).</strong> A step towards personalized sports nutrition: carbohydrate intake during exercise. <em>Sports Medicine, 44</em>(1), 25-33.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Kerksick, C. M., et al. (2017).</strong> International society of sports nutrition position stand: nutrient timing. <em>Journal of the International Society of Sports Nutrition, 14</em>(1), 33.
          </p>
          <p>
            <strong>Goldstein, E. R., et al. (2010).</strong> International society of sports nutrition position stand: caffeine and performance. <em>Journal of the International Society of Sports Nutrition, 7</em>(1), 5.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div style={{
        padding: '40px',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.maroon} 100%)`,
        borderRadius: '12px',
        textAlign: 'center',
        color: 'white',
        marginBottom: '30px'
      }}>
        <h3 style={{
          fontSize: '28px',
          marginBottom: '15px',
          fontWeight: '700'
        }}>
          WANT PERSONALIZED COACHING?
        </h3>
        <p style={{
          fontSize: '16px',
          marginBottom: '25px',
          lineHeight: '1.6',
          textAlign: 'left'
        }}>
          This calculator provides general guidelines based on scientific research and your training environment. For a truly personalized nutrition and training plan tailored to YOUR specific needs, race goals, metabolic profile, and race-day conditions, consider 1:1 coaching with Keystone Endurance.
        </p>
        <div style={{
          marginBottom: '20px',
          textAlign: 'left',
          fontSize: '15px',
          lineHeight: '1.8'
        }}>
          <p style={{ marginBottom: '8px' }}>✓ Custom training plans for swim, bike, run, and strength</p>
          <p style={{ marginBottom: '8px' }}>✓ Personalized race-day nutrition strategies adjusted for race conditions</p>
          <p style={{ marginBottom: '8px' }}>✓ Unlimited communication and bi-weekly coaching calls</p>
          <p>✓ Access to Keystone Krew Community</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <a 
            href="mailto:coach@keystoneendurance.com"
            style={{
              display: 'inline-block',
              padding: '12px 16px',
              background: 'white',
              color: colors.primary,
              fontWeight: 'bold',
              fontSize: '13px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              letterSpacing: '0.3px',
              textDecoration: 'none',
              transition: 'transform 0.2s',
              maxWidth: '95%',
              boxSizing: 'border-box',
              textAlign: 'center',
              lineHeight: '1.4'
            }}
          >
            <div style={{ fontSize: '12px', marginBottom: '2px' }}>EMAIL US:</div>
            <div style={{ fontSize: '11px', letterSpacing: '0px' }}>COACH@KEYSTONEENDURANCE.COM</div>
          </a>
        </div>
      </div>

      {/* Start Over Button */}
      <button
        onClick={startOver}
        style={{
          width: '100%',
          padding: '18px',
          fontSize: '20px',
          fontWeight: 'bold',
          background: 'white',
          color: colors.primary,
          border: `3px solid ${colors.primary}`,
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          letterSpacing: '1px'
        }}
      >
        START OVER
      </button>
    </div>
  </div>
)}

        {/* Footer */}
        <div style={{ maxWidth: '900px', margin: '40px auto 0', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'white', opacity: 0.7, paddingBottom: '40px' }}>
          <div style={{ marginBottom: '8px' }}>© 2025 Keystone Endurance | Triathlete and Distance Runner Specialists</div>
          <div>This calculator provides general nutrition guidance based on scientific research. Consult with sports nutritionists or healthcare providers for personalized medical advice.</div>
        </div>
      </div>
    </div>
  );
}
