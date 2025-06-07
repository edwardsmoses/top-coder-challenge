#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Deep optimization analysis to get below 8000...\n');

// Test current formula and identify exact issues
const currentFormula = (days, miles, receipts) => {
    let result = days * 90 + miles * 0.65 + receipts * 0.3;
    
    if (days === 1) result += 5;
    if (days >= 14) result -= 10;
    
    const spendingPerDay = receipts / days;
    const milesPerDay = miles / days;
    
    if (days >= 8 && spendingPerDay > 200 && receipts > 1500) {
        result -= receipts * 0.15;
    } else if (days >= 12 && spendingPerDay > 100 && receipts > 1000) {
        result -= receipts * 0.1;
    } else if (days === 1 && milesPerDay > 1000 && receipts > 1500) {
        result -= receipts * 0.05;
    }
    
    const hash = (days * 3 + Math.floor(miles) * 7 + Math.floor(receipts * 100) * 11) % 10;
    result += (hash - 5) * 2;
    
    return result;
};

// Calculate errors for all cases
const results = publicCases.map(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    const predicted = currentFormula(days, miles, receipts);
    const error = Math.abs(expected - predicted);
    
    return {
        ...c,
        predicted,
        error,
        days,
        miles,
        receipts,
        expected,
        milesPerDay: miles / days,
        spendPerDay: receipts / days,
        errorPct: (error / expected) * 100
    };
});

// Sort by error and analyze top errors
const worstCases = results.sort((a, b) => b.error - a.error).slice(0, 30);

console.log('Top 30 worst cases:');
worstCases.forEach((c, i) => {
    console.log(`${i+1}. ${c.days}d, ${c.miles}mi, $${c.receipts.toFixed(2)} → Expected: $${c.expected}, Got: $${c.predicted.toFixed(2)}, Error: $${c.error.toFixed(2)}`);
    console.log(`   SpendPerDay: $${c.spendPerDay.toFixed(2)}, MilesPerDay: ${c.milesPerDay.toFixed(1)}, ErrorPct: ${c.errorPct.toFixed(1)}%`);
});

// Look for patterns in high errors
console.log('\nAnalyzing patterns in high-error cases...');

// Group by different characteristics
const errorPatterns = {
    by14Days: worstCases.filter(c => c.days === 14),
    by1Day: worstCases.filter(c => c.days === 1),
    by8Days: worstCases.filter(c => c.days === 8),
    by11Days: worstCases.filter(c => c.days === 11),
    highSpending: worstCases.filter(c => c.spendPerDay > 150),
    lowSpending: worstCases.filter(c => c.spendPerDay < 100),
    highMiles: worstCases.filter(c => c.milesPerDay > 100),
    lowMiles: worstCases.filter(c => c.milesPerDay < 50)
};

Object.entries(errorPatterns).forEach(([pattern, cases]) => {
    if (cases.length > 0) {
        const avgError = cases.reduce((sum, c) => sum + c.error, 0) / cases.length;
        console.log(`${pattern}: ${cases.length} cases, avg error: $${avgError.toFixed(2)}`);
    }
});

// Test different coefficient combinations more systematically
console.log('\nTesting coefficient combinations...');

const coeffTests = [
    [85, 0.7, 0.25],
    [88, 0.68, 0.28],
    [92, 0.62, 0.32],
    [87, 0.7, 0.25],
    [93, 0.6, 0.35],
    [89, 0.67, 0.29],
    [86, 0.72, 0.24]
];

coeffTests.forEach(([dayCoeff, mileCoeff, receiptCoeff]) => {
    let totalError = 0;
    publicCases.forEach(c => {
        const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
        const expected = c.expected_output;
        const predicted = days * dayCoeff + miles * mileCoeff + receipts * receiptCoeff;
        const error = Math.abs(expected - predicted);
        totalError += error;
    });
    const avgError = totalError / publicCases.length;
    console.log(`days*${dayCoeff} + miles*${mileCoeff} + receipts*${receiptCoeff}: ${avgError.toFixed(2)}`);
});

// Look at the exact receipt factors needed for worst cases
console.log('\nReceipt factors needed for worst cases:');
worstCases.slice(0, 10).forEach(c => {
    const base = c.days * 90 + c.miles * 0.65;
    const receiptFactor = c.receipts > 0 ? (c.expected - base) / c.receipts : 0;
    console.log(`${c.days}d, ${c.miles}mi, $${c.receipts.toFixed(2)}: need factor ${receiptFactor.toFixed(3)} (current: 0.3)`);
    
    // What factor would minimize error?
    const optimalFactor = c.receipts > 0 ? (c.expected - base) / c.receipts : 0;
    console.log(`  Optimal factor: ${optimalFactor.toFixed(3)}`);
});

// Try to identify exact thresholds for negative factors
console.log('\nIdentifying negative factor thresholds...');

const negativeFactorCases = results.filter(c => {
    const base = c.days * 90 + c.miles * 0.65;
    const receiptFactor = c.receipts > 0 ? (c.expected - base) / c.receipts : 0;
    return receiptFactor < 0;
});

console.log(`Found ${negativeFactorCases.length} cases with negative receipt factors`);

// Analyze thresholds
const thresholds = {
    spendPerDay: [50, 100, 150, 200, 250],
    days: [1, 5, 8, 10, 12, 14],
    milesPerDay: [20, 50, 100, 200, 500]
};

console.log('\nAnalyzing negative factor thresholds:');
thresholds.spendPerDay.forEach(threshold => {
    const above = negativeFactorCases.filter(c => c.spendPerDay > threshold);
    const avgFactor = above.length > 0 ? above.reduce((sum, c) => {
        const base = c.days * 90 + c.miles * 0.65;
        return sum + (c.expected - base) / c.receipts;
    }, 0) / above.length : 0;
    console.log(`SpendPerDay > $${threshold}: ${above.length} cases, avg factor: ${avgFactor.toFixed(3)}`);
});

// Try a completely different approach - segment-based modeling
console.log('\nTesting segment-based approach...');

const segments = {
    shortTrips: publicCases.filter(c => c.input.trip_duration_days <= 3),
    mediumTrips: publicCases.filter(c => c.input.trip_duration_days >= 4 && c.input.trip_duration_days <= 7),
    longTrips: publicCases.filter(c => c.input.trip_duration_days >= 8 && c.input.trip_duration_days <= 11),
    veryLongTrips: publicCases.filter(c => c.input.trip_duration_days >= 12)
};

Object.entries(segments).forEach(([segmentName, cases]) => {
    console.log(`\n${segmentName} (${cases.length} cases):`);
    
    // Try different coefficients for each segment
    const testCoeffs = [
        [100, 0.6, 0.4],
        [95, 0.65, 0.35],
        [90, 0.7, 0.3],
        [85, 0.75, 0.25]
    ];
    
    testCoeffs.forEach(([dayCoeff, mileCoeff, receiptCoeff]) => {
        let totalError = 0;
        cases.forEach(c => {
            const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
            const expected = c.expected_output;
            const predicted = days * dayCoeff + miles * mileCoeff + receipts * receiptCoeff;
            const error = Math.abs(expected - predicted);
            totalError += error;
        });
        const avgError = totalError / cases.length;
        console.log(`  [${dayCoeff}, ${mileCoeff}, ${receiptCoeff}]: ${avgError.toFixed(2)}`);
    });
});