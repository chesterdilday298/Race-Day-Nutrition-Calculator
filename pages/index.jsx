import React, { useState } from 'react';

export default function RaceTrainingNutritionGuide() {
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
    weightLossRate: '', // 0.5, 1, 1.5, 2, or 'maintain'
    trainingDays: []
  });
  const [results, setResults] = useState(null);

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
      weightLossRate: '',
      trainingDays: []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Keystone Endurance brand colors
  const colors = {
    primary: '#D62027', // Red
    charcoal: '#231F20', // Charcoal Black
    maroon: '#600D0D', // Maroon
    steel: '#D62027', // Changed to Red (was Steel/Cement)
    teal: '#D62027', // Changed to Red (was Teal/Cool Grey)
    light: '#F4F4F9' // Light background
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
      activityMultiplier = 1.55; // Moderate activity
    } else if (hours < 10) {
      activityMultiplier = 1.65; // Active
    } else if (hours < 15) {
      activityMultiplier = 1.725; // Very active
    } else {
      activityMultiplier = 1.9; // Extremely active
    }
    
    // Calculate MAINTENANCE calories (TDEE)
    const maintenanceTraining = Math.round(bmr * activityMultiplier);
    const maintenanceRest = Math.round(bmr * 1.3); // Rest day multiplier
    
    // Calculate deficit based on weight loss rate
    const deficitPerDay = {
      '0.5': 250,    // 0.5 lb/week
      '1.0': 500,    // 1 lb/week
      '1.5': 750,    // 1.5 lb/week
      '2.0': 1000,   // 2 lb/week
      'maintain': 0  // No deficit
    }[formData.weightLossRate] || 0;
    
    // Apply deficit to get weight loss calories
    let trainingDayCalories = maintenanceTraining - deficitPerDay;
    let restDayCalories = maintenanceRest - deficitPerDay;
    
    // Safety check: Don't go below minimums
    const minCaloriesTraining = Math.round(bmr * 1.2); // Never below 20% above BMR on training days
    const minCaloriesRest = Math.round(bmr); // Never below BMR on rest days
    
    trainingDayCalories = Math.max(trainingDayCalories, minCaloriesTraining);
    restDayCalories = Math.max(restDayCalories, minCaloriesRest);
    
    // Calculate if safety minimum was hit
    const hitMinimumTraining = (maintenanceTraining - deficitPerDay) < minCaloriesTraining;
    const hitMinimumRest = (maintenanceRest - deficitPerDay) < minCaloriesRest;
    
    // FIXED: Calculate macros to FIT the calorie target
    // Protein for athletes (2.0g per kg body weight)
    const proteinGrams = Math.round(weightKg * 2.0);
    const proteinCals = proteinGrams * 4;
    
    // Remaining calories after protein
    const remainingTrainingCals = trainingDayCalories - proteinCals;
    const remainingRestCals = restDayCalories - proteinCals;
    
    // Training days: 70% carbs, 30% fat of remaining calories
    const trainingCarbCals = Math.round(remainingTrainingCals * 0.70);
    const trainingFatCals = remainingTrainingCals - trainingCarbCals;
    const trainingCarbGrams = Math.round(trainingCarbCals / 4);
    const trainingFatGrams = Math.round(trainingFatCals / 9);
    
    // Rest days: 50% carbs, 50% fat of remaining calories
    const restCarbCals = Math.round(remainingRestCals * 0.50);
    const restFatCals = remainingRestCals - restCarbCals;
    const restCarbGrams = Math.round(restCarbCals / 4);
    const restFatGrams = Math.round(restFatCals / 9);
    
    // Final calories (should match target, but recalculate to account for rounding)
    const finalTrainingCalories = (proteinGrams * 4) + (trainingCarbGrams * 4) + (trainingFatGrams * 9);
    const finalRestCalories = (proteinGrams * 4) + (restCarbGrams * 4) + (restFatGrams * 9);
    
    // Calculate weight loss projections
    const weightToLose = parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight);
    const weeklyDeficit = (deficitPerDay * 7);
    const expectedWeeklyLoss = weeklyDeficit / 3500; // 3500 calories = 1 lb
    const weeksToGoal = weightToLose > 0 && expectedWeeklyLoss > 0 ? Math.ceil(weightToLose / expectedWeeklyLoss) : 0;
    
    // Calculate goal date
    const goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + (weeksToGoal * 7));
    const goalDateStr = goalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
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
    
    let recommendedRate = '1.0';
    let reasoning = '';
    let warnings = [];
    
    if (weightToLose <= 0) {
      recommendedRate = 'maintain';
      reasoning = "You're at or below target weight. Focus on maintenance or muscle gain.";
    } else if (weightToLose < 10) {
      recommendedRate = '0.5';
      reasoning = "For small weight loss goals (<10 lbs), slower is better to preserve muscle and performance.";
    } else if (weightToLose < 20) {
      recommendedRate = '1.0';
      reasoning = "Moderate deficit maintains training performance while losing fat steadily.";
    } else if (weightToLose < 50) {
      recommendedRate = '1.0';
      reasoning = "Good balance of fat loss and athletic performance for your goal.";
      if (hours < 8) {
        warnings.push("Consider 1.5 lb/week if you feel strong - your training volume can support it.");
      }
    } else {
      recommendedRate = '1.5';
      reasoning = "With substantial weight to lose, start with moderate deficit. You can adjust based on how you feel.";
    }
    
    // Athlete-specific adjustments
    if (hours > 12 && weightToLose > 10) {
      warnings.push("⚠️ High training volume detected. Prioritize energy for workouts - don't go too aggressive.");
    }
    
    return { recommendedRate, reasoning, warnings, weightToLose };
  };

  const getSafetyWarning = (rate) => {
    const weightToLose = parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight);
    const hours = parseFloat(formData.weeklyHours) || 5;
    const warnings = [];
    
    // Too aggressive for amount to lose
    if (weightToLose < 20 && parseFloat(rate) >= 1.5) {
      warnings.push({
        type: 'warning',
        message: '⚠️ For less than 20 lbs to lose, we recommend 0.5-1 lb/week to preserve muscle mass and training performance.'
      });
    }
    
    // Too aggressive for high-volume athletes
    if (hours > 10 && parseFloat(rate) >= 2.0) {
      warnings.push({
        type: 'danger',
        message: '🚨 High training volume + aggressive deficit = risk of overtraining, immune suppression, and performance decline. Consider 1-1.5 lb/week maximum.'
      });
    }
    
    // Too aggressive overall
    if (parseFloat(rate) >= 2.0) {
      warnings.push({
        type: 'warning',
        message: '⚠️ Losing 2+ lbs/week is aggressive. Monitor energy levels, recovery, and training quality closely.'
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

  // Keystone Endurance logo as base64 embedded image
  const logoBase64 = "data:image/webp;base64,UklGRtAWAABXRUJQVlA4WAoAAAAgAAAAXQEAswAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDgg4hQAAFBjAJ0BKl4BtAA+USaQRiOiIaEjkapQcAoJZ278fJmO6/itGs+wcaRxX4O4wwz3Wp+w/Jn+q9oDzAP0+6RnmA/XT9ZvfJ9CfoAf0T+S9Y96AHld/tv8Lf7Y/th7Rmaaf2L8iu/7+f/k7/Pv+35j/nv6d+Sv83/5nRS6L8zP4p9ZfsX9t/az+ufuL8W/4f8kPwl9i/jzqBfhf8h/0H9F/Zf8nOP8AB9Rf9B+YP+C+NT3D/R+iX1w/3f2jfYB/G/5b/ePzh/sf/////xfeBv419M32AfyH+nf6T+x/5X9mfh5/zf8L/gv3o9un55/iP+5/jPgS/l39W/3390/zP/s/f////ed7F/3M9jX9cv/cRJVZnnQbjqQCCRPrY1IBBIn1sakAgkT62NSAQSJ9bGpAII/VkChG1Gq5B86BXZMgFqRjUufAL4crWPmCxwZ+F19ATrei/0ibdNbt1tF9HDyHsQ/3kQI/gjRNQhR0iADZQl9OgIAWzywHdnT1nFrG5Ogs4rx1s7cKola7LL6tXuB3rmFt0JFSWltatFrmlODUWZipoJbcznMZB1eh3nd68N1PrefAIvYWXD12Xq574AJ9XUUaNXYesnQNutFbMBUHLmba9DIr/q3XpXalpqWE92xgKkpaxSpWFx+clpJNvu0Yk36LIeVuWUZoXHEn7IotmTLIYeoBRwkhmgdIJscv9AGdrYSZKkAGOVxfaei2QAWLfe56Pl7D3NcF1sFgMeFEw8Hf7IRJenSRGrFghexwj5ZxRKMZG3gbZWgOUIfQX7GnAn/ZVx68yTG+18jiJD5Rvj8ZiZ86KB60Xh2A7sOuUFaQC7JuLL5G1pUkc6XFl+exbk6ziEDOhOvq/DsuBMpe7fdvBVGogleR/hb3Z1Sta/9EtXSaY+HSrh2UBSVvA/H6aBHzYlQtSF6zidpBoDrKhI2xgH6Slmj4o28qtjWsCP7vZCF1b416HmrIfjiUOMQvkDPbQDF7FeWv16cJQDqMRu1H2mBBIn10QZCAS9GGWxqQCCRPrY1IBBIn1sakAgkT62NSAQSJ9bGpAIJE+tjUgEEifUQAP7/ziUAA9ETLVxBtKTfaE691PZiptc/6yYbJX22i3CjNZPzYFQrSi1iHel9XoJiIr1GVkFJbfPY3Jp7FXr84TKMwArjVSn9U8FSMv+rwvoD8kaU91+eFM/jIRRpF7NmviqoXSkVBbDxRDbQJLSgl0ux4FbhmFqxGDDXfUIzTNd6Jt+t842+eFwlfKQQ+mR3HyJyZhFJ7ivVqUnu74RoR17uOpUJYKu0xuw1iURBJ1fYY9mydqhw5x6+jcpF/DkfPZ22yi09Tv3XwVInubl1+dGkKFeQJEzwoP3cuWzDXMCmSz/sjq/JT1kEM8iZIhY0AA0DPsKDWwBkhnPdcwZdssFX95Jxi0h18a44PsJP8PPD0Bz4cQkxblVDY8hhtruIoMkz5Z071Fxr5UT/HR/Jg+M6dhJFfVMqjV4CWQ4D6DOk+5CS/ChgAcY6CSbxLDiQOMttH7MdZNBP/y1Fy8axHgc6ndY98jIsXQ8My9aJr6cldFR2EPghFG9ivJWJl3x4wUCX3wxvUiB4pmyPZoAxTWJ3iCg2Ab5WmgMza7xd8Bn4FOq+pHNqOO9ItXlmVoXDINWNraNUwM5TesYRxz07tBgHFJf7VF33XRAS3DdMq24SdqHO7C5vL5/q7ao755Rs/aU7lN4bmxj8093NWuGgeExQ/mZ0mMRZNptPsX+8HKUjXBEhVbA19EwAdhUUC9gyWZdFq9mOi2E4lBJjCJuEtaIbTixNOVvCCv25N8/7X6wJtiC3NXohTIytZvBZwX3jO8N2OOweV3bJzkZtTF2+MKnqAjrJbWcMcXf0QqC1R9yDKSsxqe6A5A/+q9cSy4cf8C8BJspyfv5KPEO//5wozySANmDXUopQM7Rg9eo3SRIM8/HCxvQgDE7hhlD5DDQnDxPYWe9k55BIlSNwUfF+zc76jCLTekro56pE3GXG02mEDux1HSYSfJpPCUBuQ0tjrXlYjFvvKPonewWW5zUMYzzzabcWrps8aYfZxNllgeGEb/ALtR5XGSmPUTIovRH7sjKlg6QPPEVZOe8+84AxIhd6y3OJcseyUL6xq/o50Q9knM/610N5VGGAvGYaOVCQiId62dK3wli9mCPRxjZuL+4xk3K2IrVqND6opkdYC6aoY0LfzFE7mvPb/j5YQX5iLySBXbDxex1o/gjyPFe1k+3Clp5y4Oj2CS0jN5tHiuGE0ae8CO3viq7DjZ/726Uff8lpy1PvFZfguXWFUb3S57FW8wf0FsewU/WfUplz25sLrU93Nq6QnQ+BnXLd8P13n0bJaeIEcKvXOo7TWM2nJWWYyHc51gZXaTCsevw0J0pOD9i04ai61vdXvnLKTnQeVoBcaDdKJqwmM3QPQ009Wcd8xzIXQjMvjRDUCr+/fh5ceOTFNv71ox/zzFqvfCdADDVtqN/+0fX/xi0wYmTZ+/18foYZ8LGUx+Vn6/astKtmI3MNpgy0573Fw+wkqZYJ8qGtHUZutoEgNsO1yZEG13JrWAXdS0i1GZR/Df2zLdz4Fq+/Sji4s1TNSjri9N+rdwslFtdcOJqqwNnrTi5GwSwhv30oHGQe6eQ6ZHnj4gDGEbelqoaUnWh9qoBLgkzHL5Mkdfe62WAM9Nh1FkB3Nge4kvjZiCms+R4mSGsb+AzcSn+aPlQuPYfX2Qbi8i6okH0HT2LaEB4eOM/KaWr/aBdYl4CimseqMUlyLZxMClIru73ahkCEYuUDFK+jqUVbZMaUku/AQYfs5WtAeqKTwhR71d1OQ/ea0sABCRho4sAODq/rJCpJuT31/QqU3hc8EXBxtl+S8TTDrWxhCd+1qhJylSLTMTh/yVEtBMlPOMOEU8hoOy8XC/PCLXghV0PW9gKll7bflLSVBBRPheDXQhQ4MobA/1v4cEpkgklxWXKMeCHO6Z39Z/2svqLqjZLkujpGLavliWgz79T5D/uv9Bnz7POEes24OC8PBbM3FLPMWB5bz/Fa1fYWlGBzeu3g1R5KgfiH/Jdz/PR9PTa2phrhrfvtkhYalzqAWumoleifjJTSVY8tpGRTAkQhntQcgDzE8Tv7xwN58yswV0qJO9l1DZyULS73qQItDn7vT7l2cshNVxVg6wy3ln9PQdQYwvtbf7xjp34dQf/fM/vGq/5g/GMe8UN1ul78CpldTeJRgOfsIrgKf5JPAlB+ZOJr0zJU77lfqvyIJbaZ1WWoP2Y5eirVUghFO1vbnbSo/7Q24AD+1JGkTeIwEOH0pUCwV0WLU6jjoncT2qjiEA8MCXe1RoWAQYeFGkJ41gqd7rzrZrmyEQISqlDYeARfw0Xs1SASzcQoiFE4iPM8wmBY4nI9EVd0poxmRcTHQwKeTyh0UmWnhjomnsAqSwr/vIxpQZ8l0zbP5q1RpDG/vrf261oP8Jg+RenQ7CyQq05VP7JEAOI+oOsyQgwkodl8I0YyDbC6awkr13Roc5vxOElydAqPD4Wimj+HoD1a7eQHG+m6CemO7SiRtwoRv+t2exV0/Su1OIeJiOvm56LnaYdev4uLVlyoBad89QfPiw+RIZ2O9mNYCiE/wmBJxBl3oIUXecbsiLgJ8tbE1i/MyXbXhIbLj62/x9yX/VVjUHDCF89DKJ/bKf/QNkHcpph8qfIGJNmrqcCJ/EyeByorW+Ny1y4c0NdQBmAyUjleHrNWOCrJVBHH5XPFG8f/EOEsMaZmFQoRzjhJq/N2KOwRaUYw1CZa76IoEsEVzwOChU1JFdiJZKjevTQmREng7SO8fFpgTaLl6Ii3OisZPrFwqDt0fT65arjMy7wushcHUuaZTxk2ZX//yIagfto8E8zdoJBu9bu/FcThzhL7fz+eSqtE8swELwuzHmyAfnOgFobcRz1FtC5oqBKtsS/6d84ROXTed++84O3Zw3ZUFCC6quWhNM9AhuUstAI5OAbowTeY+JNMsgfLe6FzV3DFBvx2u99etFEw1RaNWzeFciprt17h/Tu/WUXWJEUaWb6Ep5/+7GWJ4a7+Q8VSFD3P6zWrEh233+91x+MqTLtRDQq9Wmz6Fn807DEXAdibdMPwYfkRf9+BsxP5B27RCCIBr5jQbh23yP+l1YH+eGLyW/DkF/VIEvWc5ZZCGy9EVICxC3915f53ajHWxaqRO8arw9CBZkplaZbD6kttjewIVuhQJtqkHrb8j2aArZZ+C2FEVkFndqLijq9hxMxpDC2MaOsrst5bppGJT305zQ7li/mg2DpwxBjsdZDmE78FBX7ObRmwdFZ2uuzJqu67qprkuhL1Sj0yH4lNBE1l6g8SVpsOhXi3AfCIavo8VMNfA5D4RZpxXSIqkHv6w9YZwFgfNpMdVMrk2cprMvg4o/dCB8a5O7sm+31LwAsTkgL+TRcUwNvgTa3dNeQizMxpFvnanXKZjjMNcZ6q5QIFtG+rb85wheWM8gF8iFzPzwQba2q9+x/tYz1cS5mR/HCcJzZ2dvLecP9vWuEpMtotRc7GulLv5TLSY2l4bngGBHUelnH9gRfG87MSji2f2HWrGUDHqN17yJbSG0fR7ZnTWoIEmxq1tmEmq+couXtCK3qcM5m5gaPH9F3/mJi5hb3Ko7yUoyKDDXC6cD7mpGO328C3Qf+x6mhdOF7aY3qPquC2UiBsfxwFTS+Z5R/x5RbuMcydG/mfYLipyC67xoU1L3wVWt38OywShrd0/PONLQ/7IRpU4ql9baLGeRnmMf5ruRn1qMzhDpM86GwPRtuXko1wwK5v8C2iv71rFjPQfibvjVPXH0z7qr7r3yqAK9fH7nxWgCIQeUUGcWfTrYvh5PaWNgVlgsjgfHghdVW6q9TYUBsJPTuHgs+5xi3FzU8o53m2tawov+VZJCzNXbDkUhISGC/eLmOoXIU5NuIn32aPrGMLYnQhymapPXA7zSAPbGvH83rnlrYUTq5CwdDEeWeImlbMNQ45j68YO/9EK5N/Dtlo4HbBNFBMCppa611WGpuY+BhxQBfhNntvDxajgZUIwfAmB5D5ftyNZT1ZbBPf3ThnJcxR7x2f6RrQBwjOqEm2T90nqaDcoQBZQ556kayC/ZHPFCfbh7b5wyNoUMaLjqjF7oYal7vGGHIuMcLFAiiPLcV3KeXBrYToJ4ra5MKGICx6WcT+j6Zvg/BrglYWg1jX/MH1q/8ZhLZep7US7QsXzyGqIycfSYBQYi6jf+x1SeF23EQNTKIdrnFTdOGb8TmxReDAgUsgq0kiKAAwBno59Zdyn+PBSQ2z1vyzd9TfKZFIrPIpNarLc2jgad3xXJTV3mHkKBfTEgYkGUcbWA+XBdOaJMuzc7pUZcB3SHfUyQ0CgQe+n85FSAVNcflty0JOdAhHZONCwtn6SmR1H80V9taBGHF1kZQDPt8oKbaUmSMc+o/EJRGdHM0Qt8PVnp1KjrrbMH7MR31flFH13/A+udxSn+Rr+W5fCc2w0Q/GtNIGWUyLLQcxQYfhPMa7o+17el33VyepPsUF0N6HMYK/xhMqWjelWBzJ7OfxlbNbMWuXGIxPEsL1UbV7d8el0BMzZOyB2nC4btPxVc4r9npA6YCKpaTOr00WEk9d0mcB7Diopc0JJvg3/ieC4FczeJ+avs+o/Yd7rNBAYYEcyNDAo4tywe8298SjbRFc7bok2SecLRPGyuM6TfiQK3a9GjoeNHJUb4PU+NE6KXcBPYN2VI+8/23gHKA1yX64z84qf6KzH2y4TKpo339lGA9uhTugMg7G5FWZLSH0iDCXH7mMQWDYF6m9nQALuyfiwd6oRWJHVflGoJWL54juy51BhuAyzOowcXvU+VwS/+OSkzG1W4GcHSsVucmD13/DUsSpmCwi9e/2A2rGpyXxbY9uOAcx2XgYT/fyrRot6rOO5PCGwGUadqD1gdNQgjTAHHSwxYReQvg+vzzbncR6NZcjNw6u0xhjIw729iK24XG1RwuruSmQvJeLDcGsFP9KADrqDNRvzWFuOtyBS/vOko9WOeqPZEEZ/qHcRaEtjab4z8wHkfxwKxa2U6FOlTh8/sqBaVb6dAgLyjR52upX9ZKnQnYDe329TrWXVu/LF7JzX+/uvwG7ouovXUGB5Zk1i0IOhqwZVSjxhBPb8nixgoj/Lz7hfy2VdfQfVgpThLRaH8Yuh5VHW+H8gozOOPLK8M0YhpjR8R4ytkyMSvmKV2kPTRCtxsQV3/dalCd819ch5UL2Qo5qzbP6J0ztK7tgvXTq6+Q4kkT5pulUPhNTI3m2vnQqNUI/H4FBgleBrw0H1/WJc+nycLLBTf+1S12GqqjmgeOSJvpEi+AznE/kNyWZH0+J39Vt+fIVIvTaX30bNCDsH9yKw6uNIgCZYUtb+X44qEzVZuTs3u3XHYXGs36xZjry16fCjECU6vLGZS46kP/qj3iuA9LWHRVUo4ZK45/MWG3mLdtgzOFNIY3bM6p0PqpHhYVQOx9jOSpJ+6bmukQhPkWq9D3/uu3aOmx3FoJB8ig8WpYFEqFL1dCVXknO71WrPzQ41WKve6h8VvaU6XnJZmYE+Txh+CLkbu1QYkO4tuhWBvY21FBirED/aw1+wFzDBin34/qwQv6BM8b7aLvcuVqsQLjm3HBVgHZtD1FXVrmNaxKVouGZqcq8rQdYAOKKDx090EaJfyl2MoGE5FbJvoVt3iHWQtpg9/QtEJMY/GdRJPTic28BTa5uqWlsgWJVxAyJr06bBFX1hZH4ZYOCfZYV093nUz2I2fcB1nlEnp2ydjXp+7A/KdQka+N2B+dMjE8nXE6B0QFS/ZZVVLLid0/CPp0GNYia56v+ygWiueS7U30vLQmbMj7VbRb/yE49ZsNZb2vvi8THcBBNcN1G1BbIZnaGnQXHF5EUmEr/UDSQlbAmc/ZILQ9ROZxLzDadz/d4JFYU8Dr2lR3rszNkmn9mAMmW5RbcasaiysSb+Augtt+zEhZF4NCl8amfJHLGvhoapf6S8IUIQR6FKHXuXa09ZY9PR0GM+T9h+dSl1upAIWicEzuYAX32SNNfDoiJaZkA1BL1tnM9TlJeSR/UGEte6tKwrKBH6llgsomtqWHOq+xGz7coQfxZXj8n8xAAAAAAAA==";

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.charcoal} 0%, ${colors.steel} 100%)`,
      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
        animation: 'pulse 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colors.teal}10 0%, transparent 70%)`,
        animation: 'pulse 5s ease-in-out infinite 1s',
        pointerEvents: 'none'
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .progress-bar {
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-enter {
          animation: slideInUp 0.5s ease-out;
        }

        button:active {
          transform: scale(0.96);
        }

        input:focus, select:focus {
          outline: none;
          box-shadow: 0 0 0 3px ${colors.primary}40;
        }

        .checkbox-wrapper input[type="checkbox"] {
          appearance: none;
          width: 22px;
          height: 22px;
          border: 2px solid ${colors.primary};
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .checkbox-wrapper input[type="checkbox"]:checked {
          background: ${colors.primary};
        }

        .checkbox-wrapper input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          color: white;
          font-size: 16px;
          font-weight: bold;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .result-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .result-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.3);
        }

        /* Mobile Responsive Styles - Enhanced */
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          overflow-x: hidden;
          max-width: 100vw;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        input, select, button {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border-radius: 8px;
        }

        input, select {
          font-size: 16px !important; /* Prevents iOS zoom on focus */
          touch-action: manipulation;
        }

        button {
          touch-action: manipulation;
          cursor: pointer;
        }

        /* Tablets and small laptops */
        @media (max-width: 768px) {
          .result-card {
            padding: 14px !important;
            margin: 0 !important;
          }
          
          h1 {
            font-size: 32px !important;
            word-wrap: break-word;
          }
          
          h2 {
            font-size: 20px !important;
            word-wrap: break-word;
          }

          h3 {
            font-size: 17px !important;
          }

          p, div, span {
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
          }

          [style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }

          [style*="minmax(250px"] {
            grid-template-columns: 1fr !important;
          }

          [style*="minmax(200px"] {
            grid-template-columns: 1fr !important;
          }

          .result-card {
            max-width: 100% !important;
            margin: 0 !important;
          }

          button {
            font-size: 15px !important;
            padding: 14px !important;
            max-width: 100% !important;
            letter-spacing: 0.3px !important;
          }
        }

        /* Large phones (iPhone 14 Pro Max, large Androids) */
        @media (max-width: 430px) {
          h1 {
            font-size: 30px !important;
          }

          h2 {
            font-size: 19px !important;
          }

          h3 {
            font-size: 16px !important;
          }

          button {
            font-size: 14px !important;
            padding: 13px !important;
          }

          .result-card {
            padding: 13px !important;
          }
        }

        /* Standard phones (iPhone 12/13/14, mid Androids) */
        @media (max-width: 390px) {
          h1 {
            font-size: 28px !important;
          }

          h2 {
            font-size: 18px !important;
          }

          h3 {
            font-size: 15px !important;
          }

          button {
            font-size: 13px !important;
            padding: 12px !important;
          }

          .result-card {
            padding: 12px !important;
          }
        }

        /* Older/smaller phones (iPhone 6/7/8/SE, small Androids) */
        @media (max-width: 375px) {
          h1 {
            font-size: 26px !important;
          }

          h2 {
            font-size: 17px !important;
          }

          h3 {
            font-size: 14px !important;
          }

          button {
            font-size: 12px !important;
            padding: 11px !important;
            letter-spacing: 0.2px !important;
          }

          .result-card {
            padding: 11px !important;
          }
        }

        /* Very small phones (iPhone 5/SE 1st gen, very small Androids) */
        @media (max-width: 320px) {
          h1 {
            font-size: 24px !important;
          }

          h2 {
            font-size: 16px !important;
          }

          h3 {
            font-size: 13px !important;
          }

          button {
            font-size: 11px !important;
            padding: 10px !important;
            letter-spacing: 0px !important;
          }

          .result-card {
            padding: 10px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderBottom: `4px solid ${colors.primary}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          {/* Keystone Endurance Logo */}
          <img 
            src={logoBase64}
            alt="Keystone Endurance"
            style={{
              height: '100px',
              width: 'auto'
            }}
          />
          
          <div style={{
            marginTop: '12px',
            fontSize: '13px',
            color: colors.primary,
            letterSpacing: '2px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600'
          }}>
            RACE TRAINING NUTRITION GUIDE
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: 'white',
        padding: '0',
        position: 'relative',
        zIndex: 5
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '16px 20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            {['Profile', 'Training', 'Goals', 'Results'].map((label, idx) => (
              <div key={idx} style={{
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
                color: step >= idx + 1 ? colors.primary : 'black',
                opacity: step >= idx + 1 ? 1 : 0.4,
                transition: 'color 0.3s'
              }}>
                {label}
              </div>
            ))}
          </div>
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
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        {step === 1 && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: '48px',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              ATHLETE PROFILE
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'black',
              marginBottom: '36px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              Let's build your personalized holiday nutrition strategy
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
                <select
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
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
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
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
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s'
                  }}
                />
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
                    WEIGHT (lbs)
                  </label>
                  <input
                    type="number"
                    value={formData.currentWeight}
                    onChange={(e) => updateFormData('currentWeight', e.target.value)}
                    placeholder="e.g., 155"
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
                    HEIGHT (inches)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateFormData('height', e.target.value)}
                    placeholder="e.g., 67"
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
                    marginTop: '4px',
                    fontSize: '12px',
                    color: 'black',
                    fontFamily: 'Inter, sans-serif',
                    opacity: 0.7
                  }}>
                    (5'7" = 67 inches)
                  </div>
                </div>
              </div>

              <div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
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
                    placeholder="Optional - leave blank if maintaining"
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
                    TARGET RACE DATE
                  </label>
                  <input
                    type="date"
                    value={formData.raceDate}
                    onChange={(e) => updateFormData('raceDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
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
                    marginTop: '4px',
                    fontSize: '12px',
                    color: 'black',
                    fontFamily: 'Inter, sans-serif',
                    opacity: 0.7
                  }}>
                    Used to calculate timeline to goal weight
                  </div>
                </div>
              </div>
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
                  <option value="triathlon">Triathlon (All Distances)</option>
                  <option value="running">Running (Marathon/Ultra)</option>
                  <option value="cycling">Cycling (Road/Gravel)</option>
                  <option value="swimming">Swimming (Open Water)</option>
                  <option value="multisport">Multi-Sport Athlete</option>
                </select>
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!formData.gender || !formData.age || !formData.sport || !formData.currentWeight || !formData.height}
              style={{
                marginTop: '36px',
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: formData.gender && formData.age && formData.sport && formData.currentWeight && formData.height
                  ? colors.primary
                  : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: formData.gender && formData.age && formData.sport && formData.currentWeight && formData.height ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: formData.gender && formData.age && formData.sport && formData.currentWeight && formData.height
                  ? `0 6px 20px ${colors.primary}60`
                  : 'none',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
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
            padding: '48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: '48px',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              TRAINING SCHEDULE
            </h1>
            <p style={{
              fontSize: '18px',
              color: colors.steel,
              marginBottom: '36px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              To customize your Holiday Nutrition Plan, help us understand your December training schedule
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
                  WEEKLY TRAINING HOURS IN DECEMBER
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
                    <label key={day} className="checkbox-wrapper" style={{
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

            </div>

            <div style={{ marginTop: '36px', display: 'flex', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
              <button
                onClick={prevStep}
                style={{
                  flex: 1,
                  padding: '16px 8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'white',
                  color: colors.steel,
                  border: `2px solid ${colors.steel}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}
              >
                ← BACK
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.weeklyHours || formData.trainingDays.length === 0}
                style={{
                  flex: 2,
                  padding: '16px 8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: formData.weeklyHours && formData.trainingDays.length > 0
                    ? colors.primary
                    : '#cccccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: formData.weeklyHours && formData.trainingDays.length > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: formData.weeklyHours && formData.trainingDays.length > 0
                    ? `0 6px 20px ${colors.primary}60`
                    : 'none',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}
              >
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: '48px',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              ⚖️ Weight Loss Strategy
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
                  return `Your target weight (${formData.targetWeight} lbs) is at or above your current weight (${formData.currentWeight} lbs). We'll calculate maintenance calories for you.`;
                } else {
                  return `You want to lose ${Math.round(weightToLose)} lbs (${formData.currentWeight} → ${formData.targetWeight} lbs). Let's determine the best approach for your goals.`;
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
                      💡 RECOMMENDED FOR YOU
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
                Select Your Approach:
              </div>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {[
                  { rate: 'maintain', label: 'Maintain Weight', deficit: '0 cal/day', description: 'Stay at current weight' },
                  { rate: '0.5', label: '0.5 lb/week', deficit: '250 cal/day', description: 'Slow & Steady - Maximum muscle preservation' },
                  { rate: '1.0', label: '1 lb/week', deficit: '500 cal/day', description: 'Recommended - Sustainable fat loss' },
                  { rate: '1.5', label: '1.5 lb/week', deficit: '750 cal/day', description: 'Moderate - Good balance for most athletes' },
                  { rate: '2.0', label: '2 lb/week', deficit: '1000 cal/day', description: 'Aggressive - Monitor closely' }
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
              
              return (
                <div style={{
                  background: '#f0fdf4',
                  border: '2px solid #86efac',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#166534', marginBottom: '12px' }}>
                    📅 PROJECTED TIMELINE
                  </div>
                  <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.8' }}>
                    <div>Expected loss: <strong>{weeklyLoss} lb/week</strong></div>
                    <div>Time to goal: <strong>{weeks} weeks</strong> (~{months} months)</div>
                    <div>Estimated goal date: <strong>{goalDateStr}</strong></div>
                  </div>
                </div>
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

        {step === 4 && (
          <div className="card-enter" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `2px solid ${colors.primary}40`
          }}>
            <h1 style={{
              fontSize: '48px',
              margin: '0 0 12px 0',
              color: 'black',
              letterSpacing: '1px'
            }}>
              2026 GOALS
            </h1>
            <p style={{
              fontSize: '18px',
              color: colors.steel,
              marginBottom: '36px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500'
            }}>
              What are you racing towards?
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
                  PRIMARY 2026 GOAL
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
                  <option value="faster">Simply get faster than 2025</option>
                </select>
              </div>


              <div style={{
                padding: '20px',
                background: colors.teal + '20',
                borderRadius: '12px',
                border: `2px solid ${colors.teal}60`
              }}>
                <div style={{
                  fontSize: '18px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '600',
                  color: 'black',
                  marginBottom: '12px'
                }}>
                  ENDURANCE ATHLETE INSIGHT
                </div>
                <div style={{
                  fontSize: '15px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'black',
                  lineHeight: '1.6',
                  opacity: 0.9
                }}>
                  Your December nutrition choices have compounding effects. Maintain lean mass now = faster spring build. Strategic holiday fueling = metabolic flexibility. This planner will show you how.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '36px', display: 'flex', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
              <button
                onClick={prevStep}
                style={{
                  flex: 1,
                  padding: '16px 8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'white',
                  color: colors.steel,
                  border: `2px solid ${colors.steel}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}
              >
                ← BACK
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.goal}
                style={{
                  flex: 2,
                  padding: '16px 8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: formData.goal ? colors.primary : '#cccccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: formData.goal ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: formData.goal ? `0 6px 20px ${colors.primary}60` : 'none',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}
              >
                GET MY PLAN →
              </button>
            </div>
          </div>
        )}

        {step === 5 && results && (() => {
          // Helper function to format sport name
          const formatSportName = (sport) => {
            const sportName = sport.split('(')[0].trim();
            return sportName.charAt(0).toUpperCase() + sportName.slice(1).toLowerCase();
          };
          
          return (
          <div className="card-enter" style={{ width: '100%', maxWidth: '100%', padding: '0', margin: '0' }}>
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
                  fontSize: '52px',
                  margin: '0 0 12px 0',
                  color: 'black',
                  letterSpacing: '1px'
                }}>
                  YOUR PERSONALIZED PLAN
                </h1>
                <p style={{
                  fontSize: '20px',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '500'
                }}>
                  Optimized for {formData.gender === 'male' ? 'Male' : 'Female'} Triathletes and Distance Runners | <span style={{ color: colors.primary, fontWeight: '700' }}>{formatSportName(formData.sport)}</span>
                </p>
                <p style={{
                  fontSize: '15px',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                  marginTop: '8px',
                  opacity: 0.7
                }}>
                  Based on Mifflin-St Jeor equation • Age {formData.age} • Current Weight: {formData.currentWeight}lbs • {Math.floor(formData.height / 12)}'{formData.height % 12}" tall
                  {formData.targetWeight && <span> • Target Weight: {formData.targetWeight}lbs</span>}
                  {formData.raceDate && <span> • Race Date: {new Date(formData.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                </p>
              </div>

              {/* BMR Display */}
              <div style={{
                background: colors.steel + '15',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: 'black',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  YOUR BASAL METABOLIC RATE (BMR)
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'black'
                }}>
                  {results.bmr} calories/day
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'black',
                  fontFamily: 'Inter, sans-serif',
                  marginTop: '4px',
                  opacity: 0.8
                }}>
                  Calories burned at rest (before activity)
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '36px',
                maxWidth: '100%',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {/* Training Day Card */}
                <div className="result-card" style={{
                  background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primary}05 100%)`,
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
                  
                  {/* Show maintenance vs target if weight loss */}
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
                  
                  {/* Show maintenance vs target if weight loss */}
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

                {/* Event Day Card */}
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
                      <span style={{ fontSize: '13px', opacity: 0.8 }}>(Average of training & rest days)</span>
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

              {/* Weight Loss Projection - Only show if losing weight */}
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
                        {formData.currentWeight} → {formData.targetWeight} lbs
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
                      <div style={{ fontSize: '24px', fontWeight: '800', color: colors.charcoal, lineHeight: '1.3' }}>
                        {results.goalDate}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        Estimated arrival
                      </div>
                    </div>
                  </div>
                  
                  {/* Safety Status Indicator */}
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
                        <>Your deficit hit minimum safe calories. This is the most aggressive we recommend for your profile. 
                        Monitor energy, recovery, and training quality closely. Consider reducing deficit if you experience 
                        fatigue, illness, or performance decline.</>
                      ) : (
                        <>This weight loss rate is sustainable and safe for your training volume. 
                        You'll preserve muscle mass, maintain performance, and reach your goal without 
                        compromising health or recovery.</>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Message - Only show if maintaining */}
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
                    Your plan is designed to maintain your current weight of <strong>{formData.currentWeight} lbs</strong>.
                    These calories support your training volume while keeping you at your current weight through the holidays.
                  </div>
                </div>
              )}

              {/* Key Strategies */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '36px',
                border: `2px solid ${colors.primary}`,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  color: colors.primary,
                  marginBottom: '20px',
                  letterSpacing: '1px',
                  wordWrap: 'break-word',
                  textAlign: 'center'
                }}>
                  YOUR DECEMBER STRATEGY
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
                  <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      PROTEIN PRIORITY
                    </div>
                    Hit {results.training.protein}g daily. {formData.gender === 'female' ? '2.0' : '2.2'}g/kg for {formData.gender === 'male' ? 'male' : 'female'} athletes. Essential for muscle preservation.
                  </div>
                  <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      CARB CYCLING
                    </div>
                    Higher carbs ({results.training.carbs}g) on training days. Reduce to {results.rest.carbs}g on rest days. Matches energy demands.
                  </div>
                  <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      TIMING MATTERS
                    </div>
                    Pre-workout: simple carbs. Post-workout (30min): protein + carbs for recovery. Events: eat strategic meal before arriving.
                  </div>
                  <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '8px', fontSize: '15px' }}>
                      STAY STRONG
                    </div>
                    Maintain strength training 2x/week minimum. Weight room work = race speed. Critical during off-season.
                  </div>
                </div>
              </div>

              {/* Gender-Specific Notes */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.teal}20 0%, ${colors.teal}10 100%)`,
                padding: '20px',
                borderRadius: '12px',
                border: `2px solid ${colors.teal}60`,
                marginBottom: '24px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  color: 'black',
                  marginBottom: '12px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '700',
                  wordWrap: 'break-word'
                }}>
                  {formData.gender === 'male' ? 'Male Athlete Considerations' : 'Female Athlete Considerations'}
                </h3>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: 'black',
                  lineHeight: '1.7',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {formData.gender === 'male' ? (
                    <>
                      • <strong>Higher calorie needs</strong> due to larger muscle mass and metabolic rate<br/>
                      • <strong>Protein: {results.training.protein}g/day</strong> (2.2g/kg) maintains muscle during reduced training<br/>
                      • <strong>Post-peak age testosterone decline</strong> makes nutrition timing even more critical<br/>
                      • Focus on zinc, magnesium, vitamin D for hormonal health
                    </>
                  ) : (
                    <>
                      • <strong>Moderate calorie approach</strong> optimized for female physiology<br/>
                      • <strong>Protein: {results.training.protein}g/day</strong> (2.0g/kg) supports lean mass<br/>
                      • <strong>Iron-rich foods critical</strong> - include lean red meat, spinach, legumes<br/>
                      • <strong>Hormonal considerations</strong> - adjust carbs based on menstrual cycle if applicable<br/>
                      • Calcium and vitamin D priority for bone health
                    </>
                  )}
                </div>
              </div>

              {/* Action Steps */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.primary}20 0%, ${colors.primary}10 100%)`,
                padding: '20px',
                borderRadius: '12px',
                border: `2px solid ${colors.primary}`,
                marginBottom: '24px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  color: 'black',
                  marginBottom: '20px',
                  letterSpacing: '1px',
                  wordWrap: 'break-word'
                }}>
                  NEXT STEPS
                </h2>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  color: 'black',
                  lineHeight: '1.8',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>1.</span>
                    <span>Screenshot this plan and save to your phone</span>
                  </div>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>2.</span>
                    <span>Pre-log your training days in MyFitnessPal or similar tracking app</span>
                  </div>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>3.</span>
                    <span>Check with your coach for any specific tweaks needed for your unique situation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '20px' }}>4.</span>
                    <span>Follow us on Instagram @KeystoneEndurance for more helpful hints, recipes, and more great information for Triathletes and Distance Runners</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div style={{
                padding: '24px 20px',
                background: colors.primary,
                borderRadius: '12px',
                boxShadow: `0 8px 24px ${colors.primary}40`,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '12px',
                  letterSpacing: '1px',
                  wordWrap: 'break-word',
                  textAlign: 'center'
                }}>
                  WANT MORE PERSONALIZED GUIDANCE?
                </div>
                <div style={{
                  fontSize: '15px',
                  fontFamily: 'Inter, sans-serif',
                  color: 'white',
                  opacity: 0.95,
                  marginBottom: '20px',
                  lineHeight: '1.8',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  textAlign: 'left'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    At Keystone Endurance, nutrition isn't a standalone plan—it's integrated into everything we do.
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    Our certified nutrition coaches specialize in triathletes and distance runners, delivering race-specific fueling plans, supplement protocols, and body composition strategies tailored to YOUR 2026 goals.
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    But here's what makes us different: We offer complete 1-to-1 Coaching that goes beyond just nutrition or just training. You get:
                  </div>
                  <div style={{ marginBottom: '8px', paddingLeft: '20px', textAlign: 'left' }}>
                    ✅ Custom training programs (swim, bike, run, strength)
                  </div>
                  <div style={{ marginBottom: '8px', paddingLeft: '20px', textAlign: 'left' }}>
                    ✅ Personalized nutrition coaching synced to your training phases
                  </div>
                  <div style={{ marginBottom: '8px', paddingLeft: '20px', textAlign: 'left' }}>
                    ✅ Ongoing performance analysis and threshold testing
                  </div>
                  <div style={{ marginBottom: '8px', paddingLeft: '20px', textAlign: 'left' }}>
                    ✅ Unlimited coach communication and bi-weekly calls
                  </div>
                  <div style={{ marginBottom: '16px', paddingLeft: '20px', textAlign: 'left' }}>
                    ✅ Access to the Keystone Krew Community for support and accountability
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    This is comprehensive, performance-focused coaching designed around YOU.
                  </div>
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
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <div style={{ fontSize: '12px', marginBottom: '2px' }}>EMAIL US:</div>
                    <div style={{ fontSize: '11px', letterSpacing: '0px' }}>COACH@KEYSTONEENDURANCE.COM</div>
                  </a>
                </div>
              </div>

            </button>
          </div>
        </div>
          );
        })()}
      </div>


      {/* Start Over Button */}
      {step === 5 && results && (
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          marginBottom: '20px'
        }}>
          <button
            onClick={resetCalculator}
            style={{
              padding: '16px 48px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '1px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 12px rgba(214, 32, 39, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(214, 32, 39, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(214, 32, 39, 0.3)';
            }}
          >
            ↻ START OVER
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderTop: `2px solid ${colors.primary}40`,
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: 'black',
          opacity: 0.7
        }}>
          <div style={{ marginBottom: '8px' }}>
            © 2025 Keystone Endurance | Triathlete and Distance Runner Specialists
          </div>
          <div>
            This planner provides general nutrition guidance. Consult healthcare providers for medical advice.
          </div>
        </div>
      </div>
    </div>
  );
}
