import { useState } from 'react';

export default function HolidayNutritionPlanner() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    sport: '',
    weeklyHours: '',
    goal: '',
    currentWeight: '',
    height: '',
    targetWeight: '',
    raceDate: '',
    holidayEvents: '',
    weightLossRate: '',
    trainingDays: []
  });
  const [results, setResults] = useState(null);

  const colors = {
    primary: '#C41E3A',
    steel: '#4A5568',
    charcoal: '#2D3748',
    teal: '#2C7A7B'
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateNutrition = () => {
    // Convert lbs to kg and inches to cm for calculations
    const weightKg = parseFloat(formData.currentWeight) * 0.453592 || 70;
    const targetWeightKg = parseFloat(formData.targetWeight) * 0.453592 || weightKg;
    const heightCm = parseFloat(formData.height) * 2.54 || 170;
    const hours = parseFloat(formData.weeklyHours) || 5;
    const age = parseInt(formData.age) || 45;
    const gender = formData.gender;
    
    // Mifflin-St Jeor Equation for BMR (weight in kg, height in cm)
    let bmr;
    if (gender === 'male') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }
    
    // Activity multipliers for endurance athletes
    let activityMultiplier;
    if (hours < 5) {
      activityMultiplier = 1.55;
    } else if (hours < 10) {
      activityMultiplier = 1.65;
    } else if (hours < 15) {
      activityMultiplier = 1.725;
    } else {
      activityMultiplier = 1.9;
    }
    
    // Calculate MAINTENANCE calories (TDEE)
    const maintenanceTraining = Math.round(bmr * activityMultiplier);
    const maintenanceRest = Math.round(bmr * 1.3);
    
    // Calculate deficit based on weight loss rate
    const deficitPerDay = {
      '0.5': 250,
      '1.0': 500,
      '1.5': 750,
      '2.0': 1000,
      'maintain': 0
    }[formData.weightLossRate] || 0;
    
    // Apply deficit to get weight loss calories
    let trainingDayCalories = maintenanceTraining - deficitPerDay;
    let restDayCalories = maintenanceRest - deficitPerDay;
    
    // Safety check: Don't go below minimums
    const minCaloriesTraining = Math.round(bmr * 1.2);
    const minCaloriesRest = Math.round(bmr);
    
    trainingDayCalories = Math.max(trainingDayCalories, minCaloriesTraining);
    restDayCalories = Math.max(restDayCalories, minCaloriesRest);
    
    // Calculate if safety minimum was hit
    const hitMinimumTraining = (maintenanceTraining - deficitPerDay) < minCaloriesTraining;
    const hitMinimumRest = (maintenanceRest - deficitPerDay) < minCaloriesRest;
    
    // FIXED: Calculate macros to FIT the calorie target (not from body weight formulas)
    // Protein for athletes (2.0g per kg body weight - essential for muscle preservation)
    const proteinGrams = Math.round(weightKg * 2.0);
    const proteinCals = proteinGrams * 4;
    
    // Calculate remaining calories after protein
    const remainingTrainingCals = trainingDayCalories - proteinCals;
    const remainingRestCals = restDayCalories - proteinCals;
    
    // Distribute remaining calories between carbs and fat
    // Training days: 70% carbs, 30% fat (need fuel for workouts)
    // Rest days: 50% carbs, 50% fat (lower carb need)
    const trainingCarbCals = Math.round(remainingTrainingCals * 0.70);
    const trainingFatCals = remainingTrainingCals - trainingCarbCals;
    const trainingCarbGrams = Math.round(trainingCarbCals / 4);
    const trainingFatGrams = Math.round(trainingFatCals / 9);
    
    const restCarbCals = Math.round(remainingRestCals * 0.50);
    const restFatCals = remainingRestCals - restCarbCals;
    const restCarbGrams = Math.round(restCarbCals / 4);
    const restFatGrams = Math.round(restFatCals / 9);
    
    // Recalculate actual total calories based on macros (should match target closely)
    const finalTrainingCalories = (proteinGrams * 4) + (trainingCarbGrams * 4) + (trainingFatGrams * 9);
    const finalRestCalories = (proteinGrams * 4) + (restCarbGrams * 4) + (restFatGrams * 9);
    
    // Calculate weight loss projections
    const weightToLose = parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight);
    const weeklyDeficit = (deficitPerDay * 7);
    const expectedWeeklyLoss = weeklyDeficit / 3500;
    const weeksToGoal = weightToLose > 0 && expectedWeeklyLoss > 0 ? Math.ceil(weightToLose / expectedWeeklyLoss) : 0;
    
    // Calculate goal date
    const goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));
    const goalDateStr = goalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Calculate race date projections if race date provided
    let weeksToRace = 0;
    let projectedRaceWeight = parseFloat(formData.currentWeight);
    let raceDateStr = '';
    
    if (formData.raceDate) {
      const raceDate = new Date(formData.raceDate);
      const today = new Date();
      const timeDiff = raceDate - today;
      weeksToRace = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
      
      if (weeksToRace > 0 && expectedWeeklyLoss > 0) {
        const totalWeightLoss = expectedWeeklyLoss * weeksToRace;
        projectedRaceWeight = parseFloat(formData.currentWeight) - totalWeightLoss;
      }
      
      raceDateStr = raceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    setResults({
      training: { 
        calories: finalTrainingCalories,
        maintenance: maintenanceTraining,
        deficit: deficitPerDay,
        protein: proteinGrams, 
        carbs: trainingCarbGrams, 
        fat: trainingFatGrams 
      },
      rest: { 
        calories: finalRestCalories,
        maintenance: maintenanceRest,
        deficit: deficitPerDay,
        protein: proteinGrams, 
        carbs: restCarbGrams, 
        fat: restFatGrams 
      },
      event: { 
        guideline: "80/20 rule: 80% on-plan choices, 20% enjoyment",
        baseCalories: Math.round((finalTrainingCalories + finalRestCalories) / 2)
      },
      bmr: Math.round(bmr),
      weightLossRate: formData.weightLossRate,
      weightToLose: weightToLose,
      weeklyDeficit: weeklyDeficit,
      expectedWeeklyLoss: expectedWeeklyLoss,
      weeksToGoal: weeksToGoal,
      goalDate: goalDateStr,
      weeksToRace: weeksToRace,
      projectedRaceWeight: projectedRaceWeight,
      raceDate: raceDateStr,
      targetWeight: parseFloat(formData.targetWeight) || 0,
      currentWeight: parseFloat(formData.currentWeight) || 0,
      hitMinimumTraining: hitMinimumTraining,
      hitMinimumRest: hitMinimumRest,
      weeklyCalories: Math.round(
        (finalTrainingCalories * formData.trainingDays.length) + 
        (finalRestCalories * (7 - formData.trainingDays.length))
      )
    });
  };

  const getWeightLossRecommendation = () => {
    const weightToLose = parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight);
    const hours = parseFloat(formData.weeklyHours) || 5;
    const weeksToRace = formData.raceDate ? (() => {
      const raceDate = new Date(formData.raceDate);
      const today = new Date();
      const timeDiff = raceDate - today;
      return Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
    })() : 0;
    
    let recommendedRate = '1.0';
    let reasoning = '';
    let warnings = [];
    
    if (weightToLose <= 0) {
      recommendedRate = 'maintain';
      reasoning = "Target weight is at or above current weight. Maintenance calories are recommended.";
    } else if (weightToLose < 10) {
      recommendedRate = '0.5';
      reasoning = "For weight loss goals under 10 pounds, a conservative approach preserves muscle mass and training performance.";
    } else if (weightToLose < 20) {
      recommendedRate = '1.0';
      reasoning = "A moderate deficit maintains training performance while achieving steady fat loss.";
    } else if (weightToLose < 50) {
      recommendedRate = '1.0';
      reasoning = "This rate balances fat loss with athletic performance for the identified goal.";
      if (hours < 8) {
        warnings.push("💡 With moderate training volume, 1.5 lb/week may be sustainable if energy levels remain strong.");
      }
    } else {
      recommendedRate = '1.5';
      reasoning = "With substantial weight to lose, a moderate deficit is appropriate. Adjustments can be made based on response.";
    }
    
    // Race-specific recommendations
    if (weeksToRace > 0 && weightToLose > 0) {
      const idealRate = weightToLose / weeksToRace;
      if (idealRate > 2.0) {
        warnings.push(`⚠️ Race timeline requires ${idealRate.toFixed(1)} lb/week to reach goal weight. This may be too aggressive. Consider adjusting either the goal weight or race selection.`);
      } else if (idealRate >= 1.5) {
        recommendedRate = '1.5';
        reasoning = `With ${weeksToRace} weeks until race day, a 1.5 lb/week approach aligns well with the timeline.`;
      } else if (idealRate >= 1.0) {
        recommendedRate = '1.0';
        reasoning = `With ${weeksToRace} weeks until race day, a 1 lb/week approach provides adequate time to reach the goal.`;
      }
    }
    
    // Athlete-specific adjustments
    if (hours > 12 && weightToLose > 10) {
      warnings.push("⚠️ High training volume detected. Energy availability for workouts should be prioritized over aggressive deficits.");
    }
    
    return { recommendedRate, reasoning, warnings, weightToLose, weeksToRace };
  };

  const getSafetyWarning = (rate) => {
    const weightToLose = parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight);
    const hours = parseFloat(formData.weeklyHours) || 5;
    const warnings = [];
    
    if (weightToLose < 20 && parseFloat(rate) >= 1.5) {
      warnings.push({
        type: 'warning',
        message: '⚠️ For weight loss under 20 pounds, rates of 0.5-1 lb/week better preserve muscle mass and training performance.'
      });
    }
    
    if (hours > 10 && parseFloat(rate) >= 2.0) {
      warnings.push({
        type: 'danger',
        message: '🚨 High training volume combined with aggressive deficits increases risk of overtraining, immune suppression, and performance decline. Maximum recommended rate: 1-1.5 lb/week.'
      });
    }
    
    if (parseFloat(rate) >= 2.0) {
      warnings.push({
        type: 'warning',
        message: '⚠️ Losing 2+ pounds per week is aggressive. Close monitoring of energy levels, recovery, and training quality is essential.'
      });
    }
    
    return warnings;
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
    if (step === 4) calculateNutrition();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const resetCalculator = () => {
    setStep(1);
    setResults(null);
    setFormData({
      gender: '',
      age: '',
      sport: '',
      weeklyHours: '',
      goal: '',
      currentWeight: '',
      height: '',
      targetWeight: '',
      raceDate: '',
      holidayEvents: '',
      weightLossRate: '',
      trainingDays: []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        input, select, button {
          font-size: 16px !important;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: ${colors.primary} !important;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card-enter {
          animation: slideIn 0.4s ease-out;
        }
        
        .result-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .result-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
        }
        
        .progress-bar {
          transition: width 0.3s ease-out;
        }
        
        @media (max-width: 768px) {
          input, select, button {
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* Background Pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(0deg, ' + colors.primary + ', ' + colors.primary + ' 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, ' + colors.primary + ', ' + colors.primary + ' 1px, transparent 1px, transparent 40px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto 40px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 8vw, 64px)',
            fontWeight: '900',
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, ' + colors.primary + ' 0%, #ff6b6b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '2px',
            textShadow: '0 0 40px rgba(196, 30, 58, 0.3)'
          }}>
            KEYSTONE ENDURANCE
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 4vw, 28px)',
            color: 'white',
            margin: 0,
            fontWeight: '300',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            opacity: 0.9
          }}>
            Race Nutrition Calculator
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          marginTop: '32px'
        }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div className="progress-bar" style={{
              width: `${(step / 5) * 100}%`,
              height: '100%',
              background: colors.primary,
              borderRadius: '4px',
              boxShadow: `0 0 10px ${colors.primary}80`
            }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 20px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        {step === 1 && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              PERSONAL PROFILE
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 3vw, 18px)',
              color: colors.steel,
              marginBottom: '36px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              Build a personalized nutrition plan optimized for performance and body composition
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  GENDER
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['male', 'female'].map(g => (
                    <button
                      key={g}
                      onClick={() => updateFormData('gender', g)}
                      style={{
                        flex: 1,
                        padding: '16px',
                        fontSize: '18px',
                        fontWeight: '600',
                        background: formData.gender === g ? colors.primary : 'white',
                        color: formData.gender === g ? 'white' : colors.charcoal,
                        border: `2px solid ${formData.gender === g ? colors.primary : '#ddd'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '600',
                    color: colors.charcoal
                  }}>
                    AGE
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateFormData('age', e.target.value)}
                    placeholder="e.g., 45"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '18px',
                      border: `2px solid ${colors.primary}40`,
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '600',
                    color: colors.charcoal
                  }}>
                    CURRENT WEIGHT (lbs)
                  </label>
                  <input
                    type="number"
                    value={formData.currentWeight}
                    onChange={(e) => updateFormData('currentWeight', e.target.value)}
                    placeholder="e.g., 220"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '18px',
                      border: `2px solid ${colors.primary}40`,
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '600',
                    color: colors.charcoal
                  }}>
                    HEIGHT (inches)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateFormData('height', e.target.value)}
                    placeholder="e.g., 70"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '18px',
                      border: `2px solid ${colors.primary}40`,
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: 'black',
                    fontFamily: 'Inter, sans-serif',
                    opacity: 0.7
                  }}>
                    5'10" = 70 inches
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '600',
                    color: colors.charcoal
                  }}>
                    TARGET RACE WEIGHT (lbs)
                  </label>
                  <input
                    type="number"
                    value={formData.targetWeight}
                    onChange={(e) => updateFormData('targetWeight', e.target.value)}
                    placeholder="e.g., 185"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '18px',
                      border: `2px solid ${colors.primary}40`,
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: 'black',
                    fontFamily: 'Inter, sans-serif',
                    opacity: 0.7
                  }}>
                    Optional - leave blank if maintaining
                  </div>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  TARGET RACE DATE (optional)
                </label>
                <input
                  type="date"
                  value={formData.raceDate}
                  onChange={(e) => updateFormData('raceDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    border: `2px solid ${colors.primary}40`,
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                  opacity: 0.7
                }}>
                  Projected race weight will be calculated based on selected nutrition strategy
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  PRIMARY SPORT
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => updateFormData('sport', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    border: `2px solid ${colors.primary}40`,
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select your sport...</option>
                  <option value="triathlon">Triathlon (Sprint - Ironman)</option>
                  <option value="running">Running (5K - Ultra)</option>
                  <option value="cycling">Cycling / Gravel</option>
                  <option value="swimming">Open Water Swimming</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  RACING GOAL
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => updateFormData('goal', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    border: `2px solid ${colors.primary}40`,
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select your goal...</option>
                  <option value="pr-race">PR at major race (A-race)</option>
                  <option value="age-group">Age Group podium</option>
                  <option value="qualify">Qualify for championships (Boston, Kona, etc.)</option>
                  <option value="complete">Complete first long-distance event</option>
                  <option value="faster">Get faster than previous season</option>
                </select>
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!formData.gender || !formData.age || !formData.currentWeight || !formData.height || !formData.sport || !formData.goal}
              style={{
                width: '100%',
                marginTop: '36px',
                padding: '18px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: (formData.gender && formData.age && formData.currentWeight && formData.height && formData.sport && formData.goal)
                  ? colors.primary
                  : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: (formData.gender && formData.age && formData.currentWeight && formData.height && formData.sport && formData.goal) ? 'pointer' : 'not-allowed',
                boxShadow: (formData.gender && formData.age && formData.currentWeight && formData.height && formData.sport && formData.goal)
                  ? `0 8px 24px ${colors.primary}60`
                  : 'none',
                letterSpacing: '0.5px',
                transition: 'all 0.2s'
              }}
            >
              CONTINUE →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              TRAINING SCHEDULE
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 3vw, 18px)',
              color: colors.steel,
              marginBottom: '36px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              Training volume and schedule determine daily caloric needs
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  WEEKLY TRAINING HOURS
                </label>
                <input
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) => updateFormData('weeklyHours', e.target.value)}
                  placeholder="e.g., 8"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    border: `2px solid ${colors.primary}40`,
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
                <div style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                  opacity: 0.8
                }}>
                  Include all swim/bike/run/strength sessions
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  TYPICAL TRAINING DAYS
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '12px',
                      borderRadius: '8px',
                      background: formData.trainingDays.includes(day) ? colors.primary + '10' : 'transparent',
                      border: `1px solid ${formData.trainingDays.includes(day) ? colors.primary : '#e0e0e0'}`,
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.trainingDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData('trainingDays', [...formData.trainingDays, day]);
                          } else {
                            updateFormData('trainingDays', formData.trainingDays.filter(d => d !== day));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        fontWeight: '500',
                        color: 'black'
                      }}>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  HOLIDAY EVENTS/PARTIES THIS MONTH
                </label>
                <select
                  value={formData.holidayEvents}
                  onChange={(e) => updateFormData('holidayEvents', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    border: `2px solid ${colors.primary}40`,
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select number...</option>
                  <option value="1-2">1-2 events</option>
                  <option value="3-5">3-5 events</option>
                  <option value="6-8">6-8 events</option>
                  <option value="9+">9+ events (busy month!)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '36px', display: 'flex', gap: '12px' }}>
              <button
                onClick={prevStep}
                style={{
                  flex: 1,
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'white',
                  color: colors.steel,
                  border: `2px solid ${colors.steel}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px'
                }}
              >
                ← BACK
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.weeklyHours || formData.trainingDays.length === 0 || !formData.holidayEvents}
                style={{
                  flex: 2,
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: (formData.weeklyHours && formData.trainingDays.length > 0 && formData.holidayEvents)
                    ? colors.primary
                    : '#cccccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: (formData.weeklyHours && formData.trainingDays.length > 0 && formData.holidayEvents) ? 'pointer' : 'not-allowed',
                  boxShadow: (formData.weeklyHours && formData.trainingDays.length > 0 && formData.holidayEvents)
                    ? `0 8px 24px ${colors.primary}60`
                    : 'none',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s'
                }}
              >
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {step === 3 && formData.currentWeight && formData.targetWeight && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              ⚖️ NUTRITION STRATEGY
            </h1>
            
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              {(() => {
                const rec = getWeightLossRecommendation();
                const weightToLose = rec.weightToLose;
                if (weightToLose <= 0) {
                  return `Target weight (${formData.targetWeight} lbs) is at or above current weight (${formData.currentWeight} lbs). Maintenance calories will be calculated.`;
                } else {
                  return `To optimize performance and body composition for race day, a ${Math.round(weightToLose)}-pound reduction has been identified (${formData.currentWeight} → ${formData.targetWeight} lbs). A sustainable nutrition strategy will preserve lean mass while achieving the target weight.`;
                }
              })()}
            </p>

            {/* Smart Recommendation Box */}
            {(() => {
              const rec = getWeightLossRecommendation();
              if (rec.weightToLose > 0) {
                return (
                  <div style={{
                    background: `${colors.primary}10`,
                    border: `2px solid ${colors.primary}40`,
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '32px'
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: colors.primary, marginBottom: '12px' }}>
                      💡 SUGGESTED APPROACH
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: colors.charcoal, marginBottom: '8px' }}>
                      {rec.recommendedRate === '0.5' ? '0.5 lb/week' :
                       rec.recommendedRate === '1.0' ? '1 lb/week' :
                       rec.recommendedRate === '1.5' ? '1.5 lb/week' :
                       rec.recommendedRate === '2.0' ? '2 lb/week' : 'Maintain Weight'}
                    </div>
                    <div style={{ fontSize: '15px', color: '#555', lineHeight: '1.6', marginBottom: '12px' }}>
                      {rec.reasoning}
                    </div>
                    {rec.warnings.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {rec.warnings.map((warning, idx) => (
                          <div key={idx} style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Weight Loss Rate Selection */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.charcoal, marginBottom: '16px' }}>
                Select Nutrition Strategy:
              </div>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {[
                  { rate: 'maintain', label: 'Maintain Weight', deficit: '0 cal/day', description: 'Maintain current weight' },
                  { rate: '0.5', label: '0.5 lb/week', deficit: '250 cal/day', description: 'Maximum muscle preservation' },
                  { rate: '1.0', label: '1 lb/week', deficit: '500 cal/day', description: 'Sustainable fat loss' },
                  { rate: '1.5', label: '1.5 lb/week', deficit: '750 cal/day', description: 'Moderate approach for most athletes' },
                  { rate: '2.0', label: '2 lb/week', deficit: '1000 cal/day', description: 'Aggressive - requires close monitoring' }
                ].map(({rate, label, deficit, description}) => (
                  <div
                    key={rate}
                    onClick={() => updateFormData('weightLossRate', rate)}
                    style={{
                      padding: '20px',
                      border: `3px solid ${formData.weightLossRate === rate ? colors.primary : '#ddd'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: formData.weightLossRate === rate ? `${colors.primary}08` : 'white',
                      position: 'relative'
                    }}
                  >
                    {formData.weightLossRate === rate && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.charcoal, marginBottom: '4px' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.primary, fontWeight: '600', marginBottom: '8px' }}>
                      {deficit} deficit
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                      {description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Warnings */}
            {formData.weightLossRate && getSafetyWarning(formData.weightLossRate).length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                {getSafetyWarning(formData.weightLossRate).map((warning, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: warning.type === 'danger' ? '#fff5f5' : '#fffbeb',
                      border: `2px solid ${warning.type === 'danger' ? '#feb2b2' : '#fcd34d'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                      {warning.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline Projection */}
            {formData.weightLossRate && formData.weightLossRate !== 'maintain' && (() => {
              const weightToLose = parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight);
              const weeklyLoss = parseFloat(formData.weightLossRate);
              const weeks = Math.ceil(weightToLose / weeklyLoss);
              const months = Math.round(weeks / 4.33);
              const goalDate = new Date();
              goalDate.setDate(goalDate.getDate() + (weeks * 7));
              const goalDateStr = goalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              
              // Race date projection
              let raceProjection = null;
              if (formData.raceDate) {
                const raceDate = new Date(formData.raceDate);
                const today = new Date();
                const timeDiff = raceDate - today;
                const weeksToRace = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));
                
                if (weeksToRace > 0) {
                  const projectedLoss = weeklyLoss * weeksToRace;
                  const projectedRaceWeight = parseFloat(formData.currentWeight) - projectedLoss;
                  const gap = projectedRaceWeight - parseFloat(formData.targetWeight);
                  
                  raceProjection = {
                    weeksToRace,
                    projectedRaceWeight: projectedRaceWeight.toFixed(1),
                    gap: gap.toFixed(1),
                    raceDateStr: raceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  };
                }
              }
              
              return (
                <>
                  <div style={{
                    background: '#f0fdf4',
                    border: '2px solid #86efac',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#166534', marginBottom: '12px' }}>
                      📅 TIMELINE TO GOAL WEIGHT
                    </div>
                    <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                      <div>Expected weekly loss: <strong>{weeklyLoss} lb/week</strong></div>
                      <div>Time to goal weight: <strong>{weeks} weeks</strong> (~{months} months)</div>
                      <div>Estimated arrival: <strong>{goalDateStr}</strong></div>
                    </div>
                  </div>
                  
                  {raceProjection && (
                    <div style={{
                      background: raceProjection.gap > 10 ? '#fff5f5' : raceProjection.gap < -5 ? '#fffbeb' : '#f0f9ff',
                      border: `2px solid ${raceProjection.gap > 10 ? '#feb2b2' : raceProjection.gap < -5 ? '#fcd34d' : '#93c5fd'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        color: raceProjection.gap > 10 ? '#991b1b' : raceProjection.gap < -5 ? '#92400e' : '#1e40af',
                        marginBottom: '12px' 
                      }}>
                        🏁 RACE DAY PROJECTION
                      </div>
                      <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                        <div>Race date: <strong>{raceProjection.raceDateStr}</strong></div>
                        <div>Weeks to race: <strong>{raceProjection.weeksToRace} weeks</strong></div>
                        <div>Projected race weight: <strong>{raceProjection.projectedRaceWeight} lbs</strong></div>
                        <div>Goal weight: <strong>{formData.targetWeight} lbs</strong></div>
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #00000020' }}>
                          {Math.abs(parseFloat(raceProjection.gap)) < 3 ? (
                            <span style={{ color: '#166534', fontWeight: '600' }}>
                              ✅ This strategy aligns well with the race timeline
                            </span>
                          ) : parseFloat(raceProjection.gap) > 0 ? (
                            <span style={{ color: '#991b1b', fontWeight: '600' }}>
                              ⚠️ Projected to be {raceProjection.gap} lbs above goal on race day. Consider increasing weekly rate or adjusting goal weight.
                            </span>
                          ) : (
                            <span style={{ color: '#92400e', fontWeight: '600' }}>
                              ⚠️ Projected to be {Math.abs(raceProjection.gap)} lbs below goal on race day. Consider decreasing weekly rate to avoid excessive loss.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'white',
                  color: colors.charcoal,
                  border: `2px solid ${colors.charcoal}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px'
                }}
              >
                ← BACK
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.weightLossRate}
                style={{
                  flex: 2,
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: formData.weightLossRate ? colors.primary : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: formData.weightLossRate ? 'pointer' : 'not-allowed',
                  boxShadow: formData.weightLossRate ? `0 8px 24px ${colors.primary}60` : 'none',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s'
                }}
              >
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (!formData.currentWeight || !formData.targetWeight) && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`,
            textAlign: 'center'
          }}>
            <h2 style={{ color: colors.primary, marginBottom: '16px' }}>Missing Information</h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
              Current weight and target weight are required to calculate nutrition strategy.
            </p>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: `0 8px 24px ${colors.primary}60`
              }}
            >
              ← GO BACK TO STEP 1
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              CONFIRM & CALCULATE
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 3vw, 18px)',
              color: colors.steel,
              marginBottom: '36px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              Review details and generate personalized nutrition plan
            </p>

            <div style={{
              background: `${colors.primary}08`,
              border: `2px solid ${colors.primary}40`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                color: colors.charcoal, 
                marginBottom: '16px',
                fontWeight: '700'
              }}>
                Summary
              </h3>
              <div style={{ fontSize: '15px', color: '#555', lineHeight: '2' }}>
                <div><strong>Profile:</strong> {formData.gender === 'male' ? 'Male' : 'Female'}, {formData.age} years old</div>
                <div><strong>Current Weight:</strong> {formData.currentWeight} lbs</div>
                {formData.targetWeight && <div><strong>Target Weight:</strong> {formData.targetWeight} lbs</div>}
                {formData.raceDate && <div><strong>Race Date:</strong> {new Date(formData.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
                <div><strong>Height:</strong> {formData.height} inches</div>
                <div><strong>Weekly Training:</strong> {formData.weeklyHours} hours</div>
                <div><strong>Training Days:</strong> {formData.trainingDays.length} days/week</div>
                {formData.weightLossRate && formData.weightLossRate !== 'maintain' && (
                  <div><strong>Strategy:</strong> {formData.weightLossRate} lb/week</div>
                )}
                {formData.weightLossRate === 'maintain' && (
                  <div><strong>Strategy:</strong> Maintenance</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: 'white',
                  color: colors.charcoal,
                  border: `2px solid ${colors.charcoal}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px'
                }}
              >
                ← BACK
              </button>
              <button
                onClick={nextStep}
                style={{
                  flex: 2,
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${colors.primary}60`,
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s'
                }}
              >
                CALCULATE PLAN →
              </button>
            </div>
          </div>
        )}

        {step === 5 && results && (() => {
          const formatSportName = (sport) => {
            const sportName = sport.split('(')[0].trim();
            return sportName.charAt(0).toUpperCase() + sportName.slice(1).toLowerCase();
          };
          
          return (
          <div className="card-enter" style={{ width: '100%', maxWidth: '100%', padding: '0', margin: '0' }}>
            {/* Start Over Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginBottom: '16px'
            }}>
              <button
                onClick={resetCalculator}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'white',
                  color: colors.charcoal,
                  border: `2px solid ${colors.charcoal}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                ↻ START OVER
              </button>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              border: `3px solid ${colors.teal}`,
              width: '100%',
              boxSizing: 'border-box',
              maxWidth: '100%'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '36px'
              }}>
                <h1 style={{
                  fontSize: 'clamp(28px, 6vw, 48px)',
                  fontWeight: '900',
                  margin: '0 0 16px 0',
                  color: colors.teal,
                  letterSpacing: '2px',
                  wordWrap: 'break-word'
                }}>
                  YOUR PERSONALIZED NUTRITION PLAN
                </h1>
                <div style={{
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                  maxWidth: '800px',
                  margin: '0 auto',
                  lineHeight: '1.6',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  Evidence-based nutrition strategy for {formatSportName(formData.sport)} athletes, calculated using the Mifflin-St Jeor equation with activity-adjusted TDEE
                </div>
              </div>

              {/* Race Goals Summary - NEW */}
              {results.targetWeight > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}05 100%)`,
                  border: `3px solid ${colors.primary}`,
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '36px'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: colors.primary,
                    marginBottom: '16px',
                    letterSpacing: '1px'
                  }}>
                    RACE PREPARATION TARGETS
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '15px',
                    color: '#555',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: '1.8'
                  }}>
                    <div><strong>Current Weight:</strong> {results.currentWeight} lbs</div>
                    <div><strong>Goal Weight:</strong> {results.targetWeight} lbs</div>
                    {results.raceDate && <div><strong>Race Date:</strong> {results.raceDate}</div>}
                    <div><strong>Strategy:</strong> {results.weightLossRate === 'maintain' ? 'Maintenance' : `${results.weightLossRate} lb/week`}</div>
                    <div><strong>Height:</strong> {formData.height} inches</div>
                  </div>
                  
                  {results.weeksToRace > 0 && results.projectedRaceWeight && (
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '20px',
                      borderTop: `2px solid ${colors.primary}40`
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: colors.charcoal,
                        marginBottom: '12px'
                      }}>
                        RACE DAY PROJECTION ({results.weeksToRace} weeks)
                      </div>
                      <div style={{
                        fontSize: '15px',
                        color: '#555',
                        lineHeight: '1.8'
                      }}>
                        <div>Projected race weight: <strong>{results.projectedRaceWeight.toFixed(1)} lbs</strong></div>
                        <div>
                          {Math.abs(results.projectedRaceWeight - results.targetWeight) < 3 ? (
                            <span style={{ color: '#166534', fontWeight: '600' }}>
                              ✅ Excellent alignment with goal weight
                            </span>
                          ) : results.projectedRaceWeight > results.targetWeight ? (
                            <span style={{ color: '#991b1b', fontWeight: '600' }}>
                              Gap to goal: +{(results.projectedRaceWeight - results.targetWeight).toFixed(1)} lbs
                            </span>
                          ) : (
                            <span style={{ color: '#92400e', fontWeight: '600' }}>
                              Below goal by: {(results.targetWeight - results.projectedRaceWeight).toFixed(1)} lbs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Daily Targets */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '36px'
              }}>
                {/* Training Day Card */}
                <div className="result-card" style={{
                  background: `linear-gradient(135deg, ${colors.primary}25 0%, ${colors.primary}08 100%)`,
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${colors.primary}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '700',
                    color: colors.primary,
                    marginBottom: '8px',
                    letterSpacing: '1px'
                  }}>
                    TRAINING DAYS
                  </div>
                  
                  {results.training.deficit > 0 && (
                    <div style={{ marginBottom: '16px', fontSize: '13px', color: '#666' }}>
                      <div style={{ opacity: 0.7 }}>Maintenance: {results.training.maintenance} cal</div>
                      <div style={{ color: colors.primary, fontWeight: '600' }}>Deficit: -{results.training.deficit} cal/day</div>
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: 'black',
                    marginBottom: '16px'
                  }}>
                    {results.training.calories}
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontFamily: 'Inter, sans-serif',
                    color: colors.charcoal,
                    opacity: 0.7,
                    marginBottom: '16px',
                    fontWeight: '600'
                  }}>
                    calories per day
                  </div>
                  <div style={{
                    borderTop: `1px solid ${colors.primary}40`,
                    paddingTop: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    color: 'black'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Protein:</strong> {results.training.protein}g ({Math.round((results.training.protein * 4 / results.training.calories) * 100)}%)
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Carbs:</strong> {results.training.carbs}g ({Math.round((results.training.carbs * 4 / results.training.calories) * 100)}%)
                    </div>
                    <div>
                      <strong>Fat:</strong> {results.training.fat}g ({Math.round((results.training.fat * 9 / results.training.calories) * 100)}%)
                    </div>
                  </div>
                </div>

                {/* Rest Day Card */}
                <div className="result-card" style={{
                  background: `linear-gradient(135deg, ${colors.steel}25 0%, ${colors.steel}08 100%)`,
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${colors.steel}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '700',
                    color: colors.steel,
                    marginBottom: '8px',
                    letterSpacing: '1px'
                  }}>
                    REST DAYS
                  </div>
                  
                  {results.rest.deficit > 0 && (
                    <div style={{ marginBottom: '16px', fontSize: '13px', color: '#666' }}>
                      <div style={{ opacity: 0.7 }}>Maintenance: {results.rest.maintenance} cal</div>
                      <div style={{ color: colors.primary, fontWeight: '600' }}>Deficit: -{results.rest.deficit} cal/day</div>
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: 'black',
                    marginBottom: '16px'
                  }}>
                    {results.rest.calories}
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontFamily: 'Inter, sans-serif',
                    color: colors.charcoal,
                    opacity: 0.7,
                    marginBottom: '16px',
                    fontWeight: '600'
                  }}>
                    calories per day
                  </div>
                  <div style={{
                    borderTop: `1px solid ${colors.steel}40`,
                    paddingTop: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    color: 'black'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Protein:</strong> {results.rest.protein}g ({Math.round((results.rest.protein * 4 / results.rest.calories) * 100)}%)
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Carbs:</strong> {results.rest.carbs}g ({Math.round((results.rest.carbs * 4 / results.rest.calories) * 100)}%)
                    </div>
                    <div>
                      <strong>Fat:</strong> {results.rest.fat}g ({Math.round((results.rest.fat * 9 / results.rest.calories) * 100)}%)
                    </div>
                  </div>
                </div>

                {/* Party/Event Day Card */}
                <div className="result-card" style={{
                  background: `linear-gradient(135deg, ${colors.teal}25 0%, ${colors.teal}08 100%)`,
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${colors.teal}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '700',
                    color: colors.teal,
                    marginBottom: '8px',
                    letterSpacing: '1px'
                  }}>
                    PARTY/EVENT DAYS
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'black',
                    marginBottom: '16px',
                    lineHeight: '1.2'
                  }}>
                    80/20 RULE
                  </div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    color: 'black',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      80% of choices stay on-plan (protein priority, vegetable focus)
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      20% for enjoyment (dessert, drinks, indulgences) - guilt-free
                    </div>
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.teal}40` }}>
                      <strong>Target: ~{results.event.baseCalories} calories</strong><br/>
                      <span style={{ fontSize: '13px', opacity: 0.8' }}>(Average of training & rest days)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Summary */}
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '36px',
                textAlign: 'center',
                border: `2px solid ${colors.primary}`
              }}>
                <div style={{
                  fontSize: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: colors.primary,
                  marginBottom: '8px',
                  letterSpacing: '1px'
                }}>
                  WEEKLY TOTAL
                </div>
                <div style={{
                  fontSize: '38px',
                  fontWeight: 'bold',
                  color: 'black'
                }}>
                  {results.weeklyCalories.toLocaleString()} calories
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                  marginTop: '8px',
                  opacity: 0.7
                }}>
                  {formData.trainingDays.length} training days + {7 - formData.trainingDays.length} rest days
                </div>
              </div>

              {/* Weight Loss Projection */}
              {results.weightLossRate && results.weightLossRate !== 'maintain' && results.weightToLose > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}05 100%)`,
                  padding: '28px',
                  borderRadius: '12px',
                  marginBottom: '36px',
                  border: `3px solid ${colors.primary}`,
                  boxShadow: `0 8px 24px ${colors.primary}30`
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '800',
                    color: colors.primary,
                    marginBottom: '20px',
                    letterSpacing: '1px',
                    textAlign: 'center'
                  }}>
                    📊 WEIGHT LOSS PROJECTION
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                        WEIGHT TO LOSE
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: colors.charcoal }}>
                        {Math.round(results.weightToLose)} lbs
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {results.currentWeight} → {results.targetWeight} lbs
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                        WEEKLY RATE
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: colors.primary }}>
                        {results.expectedWeeklyLoss.toFixed(1)} lbs
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {(results.weeklyDeficit / 1000).toFixed(1)}k cal deficit/week
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                        TIME TO GOAL
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: colors.charcoal }}>
                        {results.weeksToGoal} weeks
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        ~{Math.round(results.weeksToGoal / 4.33)} months
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                        GOAL DATE
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: colors.charcoal, lineHeight: '1.3' }}>
                        {results.goalDate}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        Estimated arrival
                      </div>
                    </div>
                  </div>
                  
                  {/* Safety Status */}
                  <div style={{
                    background: results.hitMinimumTraining || results.hitMinimumRest ? '#fff5f5' : '#f0fdf4',
                    border: `2px solid ${results.hitMinimumTraining || results.hitMinimumRest ? '#feb2b2' : '#86efac'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: results.hitMinimumTraining || results.hitMinimumRest ? '#991b1b' : '#166534',
                      marginBottom: '8px' 
                    }}>
                      {results.hitMinimumTraining || results.hitMinimumRest ? '⚠️ SAFETY LIMIT REACHED' : '✅ SAFE & SUSTAINABLE PLAN'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                      {results.hitMinimumTraining || results.hitMinimumRest ? (
                        <>Calorie targets are at recommended minimums for health and performance. Close monitoring of energy levels, recovery, and training quality is essential. Consider reducing deficit if experiencing fatigue, illness, or performance decline.</>
                      ) : (
                        <>This nutrition strategy is sustainable and safe for the identified training volume. It preserves muscle mass, maintains performance, and supports goal achievement without compromising health or recovery.</>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Message */}
              {results.weightLossRate === 'maintain' && (
                <div style={{
                  background: `linear-gradient(135deg, ${colors.teal}15 0%, ${colors.teal}05 100%)`,
                  padding: '24px',
                  borderRadius: '12px',
                  marginBottom: '36px',
                  border: `2px solid ${colors.teal}`,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '700',
                    color: colors.teal,
                    marginBottom: '12px'
                  }}>
                    ⚖️ MAINTENANCE PLAN
                  </div>
                  <div style={{
                    fontSize: '15px',
                    color: '#555',
                    lineHeight: '1.6',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    This plan maintains current weight of <strong>{results.currentWeight} lbs</strong>. Calories are calculated to support training volume while preserving body composition through the season.
                  </div>
                </div>
              )}

              {/* Implementation Strategy */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '36px',
                border: `2px solid ${colors.primary}`
              }}>
                <h2 style={{
                  fontSize: '24px',
                  color: colors.primary,
                  marginBottom: '20px',
                  letterSpacing: '1px',
                  textAlign: 'center'
                }}>
                  IMPLEMENTATION STRATEGY
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: 'black',
                  lineHeight: '1.6'
                }}>
                  <div>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      PROTEIN PRIORITY
                    </div>
                    Target {results.training.protein}g daily. 2.0g/kg body weight for athletes. Essential for muscle preservation during training and caloric deficit.
                  </div>
                  <div>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      CARB CYCLING
                    </div>
                    Higher carbs ({results.training.carbs}g) on training days. Reduced to {results.rest.carbs}g on rest days. Matches energy demands to activity level.
                  </div>
                  <div>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      NUTRIENT TIMING
                    </div>
                    Pre-workout: simple carbs 30-60 min before. Post-workout (within 30 min): protein + carbs for optimal recovery. Events: strategic meal before arriving.
                  </div>
                  <div>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      STRENGTH MAINTENANCE
                    </div>
                    Maintain strength training 2x/week minimum during off-season. Resistance work supports race speed and muscle preservation.
                  </div>
                </div>
              </div>

              {/* Athlete Considerations */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.teal}20 0%, ${colors.teal}10 100%)`,
                padding: '20px',
                borderRadius: '12px',
                border: `2px solid ${colors.teal}60`,
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  color: 'black',
                  marginBottom: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '700'
                }}>
                  {formData.gender === 'male' ? 'Male Athlete Considerations' : 'Female Athlete Considerations'}
                </h3>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: 'black',
                  lineHeight: '1.7'
                }}>
                  {formData.gender === 'male' ? (
                    <>
                      • <strong>Higher calorie needs</strong> due to larger muscle mass and metabolic rate<br/>
                      • <strong>Protein: {results.training.protein}g/day</strong> (2.0g/kg) maintains muscle during reduced training<br/>
                      • <strong>Hormonal health</strong> - adequate calorie intake supports testosterone production<br/>
                      • Focus on zinc, magnesium, vitamin D for optimal hormonal function
                    </>
                  ) : (
                    <>
                      • <strong>Calorie approach</strong> optimized for female physiology and hormonal fluctuation<br/>
                      • <strong>Protein: {results.training.protein}g/day</strong> (2.0g/kg) supports lean mass<br/>
                      • <strong>Iron-rich foods critical</strong> - include lean red meat, spinach, legumes<br/>
                      • <strong>Hormonal considerations</strong> - carb intake may vary with menstrual cycle<br/>
                      • Calcium and vitamin D priority for bone health and performance
                    </>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.primary}10 100%)`,
                padding: '20px',
                borderRadius: '12px',
                border: `2px solid ${colors.primary}`,
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  color: 'black',
                  marginBottom: '20px',
                  letterSpacing: '1px'
                }}>
                  NEXT STEPS
                </h2>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  color: 'black',
                  lineHeight: '1.8'
                }}>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>1.</span>
                    <span>Screenshot this plan and save for reference</span>
                  </div>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>2.</span>
                    <span>Pre-log training days in MyFitnessPal or similar tracking application</span>
                  </div>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>3.</span>
                    <span>Prepare high-protein options (Greek yogurt, lean meats, protein powder)</span>
                  </div>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>4.</span>
                    <span>Stock complex carb sources (oats, rice, sweet potato, fruit)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>5.</span>
                    <span>Plan strategic meals before events (protein + vegetables + moderate carbs)</span>
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.charcoal} 0%, #1a1a1a 100%)`,
                padding: '32px',
                borderRadius: '12px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  marginBottom: '16px',
                  fontWeight: '800',
                  letterSpacing: '1px'
                }}>
                  READY TO ELEVATE YOUR PERFORMANCE?
                </h2>
                <p style={{
                  fontSize: '16px',
                  marginBottom: '24px',
                  opacity: 0.9,
                  lineHeight: '1.6',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  This calculator provides foundation nutrition guidelines. For personalized coaching that includes training plans, race strategy, and accountability, Keystone Endurance offers comprehensive 1:1 coaching programs.
                </p>
                <div style={{
                  fontSize: '14px',
                  opacity: 0.7,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Connect via Instagram: <strong>@keystoneendurance</strong>
                </div>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
