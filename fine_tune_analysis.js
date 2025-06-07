#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Fine-tuning analysis for remaining high-error cases...\n');

// Test the current simple formula and find the worst cases
const currentFormula = (d, m, r) => d * 95 + m * 0.6 + r * 0.35;

const results = publicCases.map(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    const predicted = currentFormula(days, miles, receipts);
    const error = Math.abs(expected - predicted);
    
    return {
        ...c,
        predicted,
        error,
        milesPerDay: miles / days,
        spendPerDay: receipts / days,
        receiptFactor: receipts > 0 ? (expected - (days * 95 + miles * 0.6)) / receipts : 0
    };
});

// Sort by error and analyze the worst cases
const worstCases = results.sort((a, b) => b.error - a.error).slice(0, 20);

console.log('Top 20 worst cases with current formula:');
worstCases.forEach((c, i) => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    console.log(`${i+1}. ${days}d, ${miles}mi, $${receipts} → Expected: $${expected}, Got: $${c.predicted.toFixed(2)}, Error: $${c.error.toFixed(2)}`);
    console.log(`   SpendPerDay: $${c.spendPerDay.toFixed(2)}, MilesPerDay: ${c.milesPerDay.toFixed(1)}, ReceiptFactor: ${c.receiptFactor.toFixed(3)}`);
});

// Analyze patterns in the worst cases
console.log('\nAnalyzing patterns in worst cases...');

const patterns = {
    highSpendingLongTrips: worstCases.filter(c => c.input.trip_duration_days >= 8 && c.spendPerDay > 150),
    extremeMileage: worstCases.filter(c => c.milesPerDay > 500 || c.milesPerDay < 20),
    highReceipts: worstCases.filter(c => c.input.total_receipts_amount > 1500),
    negativeFactors: worstCases.filter(c => c.receiptFactor < 0)
};

console.log(`High spending long trips: ${patterns.highSpendingLongTrips.length}`);
console.log(`Extreme mileage: ${patterns.extremeMileage.length}`);
console.log(`High receipts (>$1500): ${patterns.highReceipts.length}`);
console.log(`Negative receipt factors: ${patterns.negativeFactors.length}`);

// Look at the specific error cases from the evaluation
const specificErrors = [
    { days: 8, miles: 795, receipts: 1645.99, expected: 644.69 },
    { days: 11, miles: 740, receipts: 1171.99, expected: 902.09 },
    { days: 14, miles: 481, receipts: 939.99, expected: 877.17 },
    { days: 1, miles: 1082, receipts: 1809.49, expected: 446.94 },
    { days: 8, miles: 482, receipts: 1411.49, expected: 631.81 }
];

console.log('\nAnalyzing specific error cases:');
specificErrors.forEach(c => {
    const base = c.days * 95 + c.miles * 0.6;
    const receiptFactor = (c.expected - base) / c.receipts;
    const predicted = currentFormula(c.days, c.miles, c.receipts);
    
    console.log(`${c.days}d, ${c.miles}mi, $${c.receipts}`);
    console.log(`  Expected: $${c.expected}, Predicted: $${predicted.toFixed(2)}`);
    console.log(`  Base: $${base.toFixed(2)}, Receipt factor needed: ${receiptFactor.toFixed(3)}`);
    console.log(`  SpendPerDay: $${(c.receipts/c.days).toFixed(2)}, MilesPerDay: ${(c.miles/c.days).toFixed(1)}`);
});

// Try to find better coefficients for the formula
console.log('\nTesting variations of the formula...');

const variations = [
    { name: 'days*95 + miles*0.6 + receipts*0.2', calc: (d, m, r) => d * 95 + m * 0.6 + r * 0.2 },
    { name: 'days*95 + miles*0.6 + receipts*0.1', calc: (d, m, r) => d * 95 + m * 0.6 + r * 0.1 },
    { name: 'days*95 + miles*0.6 + receipts*0.25', calc: (d, m, r) => d * 95 + m * 0.6 + r * 0.25 },
    { name: 'days*100 + miles*0.58 + receipts*0.3', calc: (d, m, r) => d * 100 + m * 0.58 + r * 0.3 },
    { name: 'days*90 + miles*0.65 + receipts*0.3', calc: (d, m, r) => d * 90 + m * 0.65 + r * 0.3 }
];

variations.forEach(formula => {
    let totalError = 0;
    publicCases.forEach(c => {
        const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
        const expected = c.expected_output;
        const predicted = formula.calc(days, miles, receipts);
        const error = Math.abs(expected - predicted);
        totalError += error;
    });
    const avgError = totalError / publicCases.length;
    console.log(`${formula.name}: Avg error ${avgError.toFixed(2)}`);
});

// Look for cases where simple linear formula works very well
const bestCases = results.filter(r => r.error < 20).slice(0, 10);
console.log('\nBest performing cases (error < $20):');
bestCases.forEach(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    console.log(`${days}d, ${miles}mi, $${receipts} → $${expected} (predicted: $${c.predicted.toFixed(2)}, error: $${c.error.toFixed(2)})`);
});

// Check if the issue is specific receipt factors for problematic combinations
console.log('\nReceipt factor distribution for problematic cases:');
const problematicCases = worstCases.slice(0, 10);
problematicCases.forEach(c => {
    console.log(`Factor: ${c.receiptFactor.toFixed(3)}, SpendPerDay: $${c.spendPerDay.toFixed(2)}, Days: ${c.input.trip_duration_days}, Miles/Day: ${c.milesPerDay.toFixed(1)}`);
});