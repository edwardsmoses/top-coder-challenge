#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing very long trips (10+ days)...\n');

// Filter for long trips
const longTrips = publicCases.filter(c => c.input.trip_duration_days >= 10);

console.log(`Found ${longTrips.length} long trips (10+ days)`);
console.log('Days\tMiles\tReceipts\tExpected\tPer-Day\tMiles/Day\tSpend/Day');

longTrips.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const perDay = expected / days;
    const milesPerDay = miles / days;
    const spendPerDay = receipts / days;
    
    console.log(`${days}\t${miles}\t${receipts.toFixed(2)}\t\t${expected}\t\t${perDay.toFixed(2)}\t${milesPerDay.toFixed(1)}\t\t${spendPerDay.toFixed(2)}`);
});

console.log('\nAnalyzing what the base formula would give vs actual:');
longTrips.slice(0, 10).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const baseFormula = days * 100 + miles * 0.58;
    const receiptNeeded = expected - baseFormula;
    const receiptFactor = receipts > 0 ? receiptNeeded / receipts : 0;
    
    console.log(`${days} days, ${miles} miles, $${receipts.toFixed(2)}: Expected=${expected}, Base=${baseFormula.toFixed(2)}, Need=${receiptNeeded.toFixed(2)}, Factor=${receiptFactor.toFixed(2)}`);
});

// Look at the pattern for very long trips specifically
console.log('\nLooking at 14-day trips specifically:');
const fourteenDayTrips = publicCases.filter(c => c.input.trip_duration_days === 14);
fourteenDayTrips.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    // What would different formulas give?
    const formula1 = days * 60 + miles * 0.58 + receipts * 0.2; // Reduced per-day rate
    const formula2 = days * 80 + miles * 0.58 + receipts * 0.1; // Even more reduced
    const formula3 = days * 50 + miles * 0.58 + receipts * 0.3; // Very low per-day
    
    console.log(`Miles=${miles}, Receipts=${receipts.toFixed(2)}, Expected=${expected}`);
    console.log(`  F1 ($60/day): ${formula1.toFixed(2)}, F2 ($80/day): ${formula2.toFixed(2)}, F3 ($50/day): ${formula3.toFixed(2)}`);
});