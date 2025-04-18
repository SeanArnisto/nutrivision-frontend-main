export const FindTablespoons = (value: number, minIntake: number, maxIntake: number): number => {
    let number = 0;
    const tablespoon = 15;
    const fiveTablespoons = 75;
    const fourTablespoons = 60;
    const threeTablespoons = 45;
    const twoTablespoons = 30;
    const halfTablespoon = 7.5;
    const quarterTablespoon = 3.75;

    const oneGreen = 1;
    const twoGreen = 2;
    const threeGreen = 3;
    const fourGreen = 4;
    const fiveGreen = 5;
    const fiveGreenPlus = 6;
    const oneRed = 7;
    const twoRed = 8;
    const threeRed = 9;
    const fourRed = 10;
    const fiveRed = 11;
    const fiveRedPlus = 12;
    const oneGreenLess = 13;
    const oneRedLess = 14;

    // For values greater than 5 tablespoons (75)
    if (value > fiveTablespoons && value > maxIntake) {
        number = fiveRedPlus;
    } else if (value > fiveTablespoons && (value < maxIntake && value > minIntake)) {
        number = fiveGreenPlus;
    } else if (value > fiveTablespoons && value < minIntake) {
        number = fiveRed;
    }
    
    // For values equal to 5 tablespoons (75)
    else if (value === fiveTablespoons && value > maxIntake) {
        number = fiveRed;
    } else if (value === fiveTablespoons && (value <= maxIntake && value >= minIntake)) {
        number = fiveGreen;
    } else if (value === fiveTablespoons && value < minIntake) {
        number = fiveRed;
    }
    
    // For values between 4 and 5 tablespoons (60-75)
    else if (value < fiveTablespoons && value >= fourTablespoons && value > maxIntake) {
        number = fourRed;
    } else if (value < fiveTablespoons && value >= fourTablespoons && (value <= maxIntake && value >= minIntake)) {
        number = fourGreen;
    } else if (value < fiveTablespoons && value >= fourTablespoons && value < minIntake) {
        number = fourRed;
    }
    
    // For values between 3 and 4 tablespoons (45-60)
    else if (value < fourTablespoons && value >= threeTablespoons && value > maxIntake) {
        number = threeRed;
    } else if (value < fourTablespoons && value >= threeTablespoons && (value <= maxIntake && value >= minIntake)) {
        number = threeGreen;
    } else if (value < fourTablespoons && value >= threeTablespoons && value < minIntake) {
        number = threeRed;
    }
    
    // For values between 2 and 3 tablespoons (30-45)
    else if (value < threeTablespoons && value >= twoTablespoons && value > maxIntake) {
        number = twoRed;
    } else if (value < threeTablespoons && value >= twoTablespoons && (value <= maxIntake && value >= minIntake)) {
        number = twoGreen;
    } else if (value < threeTablespoons && value >= twoTablespoons && value < minIntake) {
        number = twoRed;
    }
    
    // For values between 1 and 2 tablespoons (15-30)
    else if (value < twoTablespoons && value >= tablespoon && value > maxIntake) {
        number = oneRed;
    } else if (value < twoTablespoons && value >= tablespoon && (value <= maxIntake && value >= minIntake)) {
        number = oneGreen;
    } else if (value < twoTablespoons && value >= tablespoon && value < minIntake) {
        number = oneRed;
    }
    
    // For values between 0.5 and 1 tablespoon (7.5-15)
    else if (value < tablespoon && value >= halfTablespoon && value > maxIntake) {
        number = oneRedLess;
    } else if (value < tablespoon && value >= halfTablespoon && (value <= maxIntake && value >= minIntake)) {
        number = oneGreenLess;
    } else if (value < tablespoon && value >= halfTablespoon && value < minIntake) {
        number = oneRedLess;
    }
    
    // For values less than 0.5 tablespoon (7.5)
    else if (value < halfTablespoon && value > maxIntake) {
        number = oneRedLess;
    } else if (value < halfTablespoon && (value <= maxIntake && value >= minIntake)) {
        number = oneGreenLess;
    } else if (value < halfTablespoon && value < minIntake) {
        number = oneRedLess;
    }

    return number;
}

export function EquivalentTablespoon(value: number): string {
    let tbpsCount = '';

    if (value < 15) {
        tbpsCount = 'less than 1 tbsp';
    } else {
        value = Math.round(value / 15);
        tbpsCount = `${value} tbsp${value > 1 ? '`s' : ''}`;
    }

    return tbpsCount;
}