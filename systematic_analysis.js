#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Systematic analysis to find precise patterns...\n');

// Create a comprehensive dataset with all derived features
const dataset = publicCases.map(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    return {
        days,
        miles,
        receipts,
        expected,
        milesPerDay: miles / days,
        spendPerDay: receipts / days,
        receiptToMiles: receipts / (miles || 1),
        milesSquared: miles * miles,
        daysSquared: days * days,
        receiptsSquared: receipts * receipts,
        daysMiles: days * miles,
        daysReceipts: days * receipts,
        milesReceipts: miles * receipts,
        daysMilesReceipts: days * miles * receipts
    };
});

// Try different per-day rates and find the best base
console.log('Finding optimal per-day rates...');

const tripLengthGroups = {
    short: dataset.filter(d => d.days <= 3),
    medium: dataset.filter(d => d.days >= 4 && d.days <= 7),
    long: dataset.filter(d => d.days >= 8 && d.days <= 11),
    veryLong: dataset.filter(d => d.days >= 12)
};

Object.entries(tripLengthGroups).forEach(([groupName, group]) => {
    console.log(`\n${groupName} trips (${group.length} cases):`);
    
    // Try different per-day rates
    for (let rate = 80; rate <= 120; rate += 10) {
        let totalError = 0;
        group.forEach(d => {
            const base = d.days * rate + d.miles * 0.58;
            const error = Math.abs(d.expected - base);
            totalError += error;
        });
        const avgError = totalError / group.length;
        console.log(`  Rate $${rate}/day: Avg error ${avgError.toFixed(2)}`);
    }
});

// Find optimal mileage rate
console.log('\nFinding optimal mileage rates...');
for (let mileRate = 0.4; mileRate <= 0.8; mileRate += 0.05) {
    let totalError = 0;
    dataset.forEach(d => {
        const base = d.days * 100 + d.miles * mileRate;
        const error = Math.abs(d.expected - base);
        totalError += error;
    });
    const avgError = totalError / dataset.length;
    console.log(`Mileage rate $${mileRate.toFixed(2)}/mile: Avg error ${avgError.toFixed(2)}`);
}

// Analyze receipt factors by different segments
console.log('\nAnalyzing receipt factors by segments...');

// Group by days and analyze receipt factors
for (let dayGroup = 1; dayGroup <= 14; dayGroup++) {
    const groupCases = dataset.filter(d => d.days === dayGroup);
    if (groupCases.length < 5) continue;
    
    const factors = groupCases.map(d => {
        let perDayRate = 100;
        if (dayGroup >= 14) perDayRate = 60;
        else if (dayGroup >= 12) perDayRate = 70;
        else if (dayGroup >= 10) perDayRate = 80;
        else if (dayGroup >= 8) perDayRate = 90;
        
        const base = d.days * perDayRate + d.miles * 0.58;
        return d.receipts > 0 ? (d.expected - base) / d.receipts : 0;
    });
    
    factors.sort((a, b) => a - b);
    const median = factors[Math.floor(factors.length / 2)];
    const avg = factors.reduce((sum, f) => sum + f, 0) / factors.length;
    const min = factors[0];
    const max = factors[factors.length - 1];
    
    console.log(`${dayGroup} days (${groupCases.length} cases): avg=${avg.toFixed(3)}, median=${median.toFixed(3)}, range=[${min.toFixed(3)}, ${max.toFixed(3)}]`);
}

// Try to find a simple formula that works better
console.log('\nTesting simple formulas...');

const formulas = [
    { name: 'days*100 + miles*0.58 + receipts*0.3', calc: d => d.days * 100 + d.miles * 0.58 + d.receipts * 0.3 },
    { name: 'days*100 + miles*0.58 + receipts*0.4', calc: d => d.days * 100 + d.miles * 0.58 + d.receipts * 0.4 },
    { name: 'days*100 + miles*0.58 + receipts*0.5', calc: d => d.days * 100 + d.miles * 0.58 + d.receipts * 0.5 },
    { name: 'days*95 + miles*0.6 + receipts*0.35', calc: d => d.days * 95 + d.miles * 0.6 + d.receipts * 0.35 },
    { name: 'days*90 + miles*0.65 + receipts*0.4', calc: d => d.days * 90 + d.miles * 0.65 + d.receipts * 0.4 },
    { name: 'days*105 + miles*0.55 + receipts*0.35', calc: d => d.days * 105 + d.miles * 0.55 + d.receipts * 0.35 }
];

formulas.forEach(formula => {
    let totalError = 0;
    dataset.forEach(d => {
        const calculated = formula.calc(d);
        const error = Math.abs(d.expected - calculated);
        totalError += error;
    });
    const avgError = totalError / dataset.length;
    console.log(`${formula.name}: Avg error ${avgError.toFixed(2)}`);
});

// Analyze outliers - cases with very high errors
console.log('\nAnalyzing outlier patterns...');

const outliers = dataset.filter(d => {
    const simple = d.days * 100 + d.miles * 0.58 + d.receipts * 0.4;
    const error = Math.abs(d.expected - simple);
    return error > 200;
}).slice(0, 20);

console.log(`Found ${outliers.length} outliers with >$200 error:`);
outliers.forEach(d => {
    const simple = d.days * 100 + d.miles * 0.58 + d.receipts * 0.4;
    const error = Math.abs(d.expected - simple);
    console.log(`${d.days}d, ${d.miles}mi, $${d.receipts} → $${d.expected} (predicted: $${simple.toFixed(2)}, error: $${error.toFixed(2)})`);
    
    // Check ratios
    console.log(`  SpendPerDay: ${d.spendPerDay.toFixed(2)}, MilesPerDay: ${d.milesPerDay.toFixed(1)}, R/M: ${d.receiptToMiles.toFixed(2)}`);
});

// Look for patterns in the best-performing cases
console.log('\nAnalyzing best-performing cases...');

const bestCases = dataset.filter(d => {
    const simple = d.days * 100 + d.miles * 0.58 + d.receipts * 0.4;
    const error = Math.abs(d.expected - simple);
    return error < 10;
}).slice(0, 10);

console.log(`Found ${bestCases.length} cases with <$10 error:`);
bestCases.forEach(d => {
    const simple = d.days * 100 + d.miles * 0.58 + d.receipts * 0.4;
    const error = Math.abs(d.expected - simple);
    console.log(`${d.days}d, ${d.miles}mi, $${d.receipts} → $${d.expected} (predicted: $${simple.toFixed(2)}, error: $${error.toFixed(2)})`);
});