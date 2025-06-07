#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Deep pattern analysis...\n');

// Try to find simple linear relationships
let cases = publicCases.slice(0, 50); // Analyze first 50 cases

console.log('Looking for simple patterns:');
console.log('Days\tMiles\tReceipts\tExpected\tDays*100\tMiles*0.5\tReceipts\tSum');

for (let i = 0; i < Math.min(10, cases.length); i++) {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = cases[i].input;
    const expected = cases[i].expected_output;
    
    const daysContrib = days * 100;
    const milesContrib = miles * 0.5;
    const sum = daysContrib + milesContrib + receipts;
    
    console.log(`${days}\t${miles}\t${receipts}\t\t${expected}\t\t${daysContrib}\t\t${milesContrib.toFixed(2)}\t\t${receipts}\t\t${sum.toFixed(2)}`);
}

console.log('\nTrying different base rates:');

// Test different per-day rates
const rates = [100, 110, 120, 130];
const mileageRates = [0.5, 0.58, 0.65, 1.0];

for (let rate of rates) {
    for (let mileRate of mileageRates) {
        let totalError = 0;
        let testCount = 0;
        
        for (let i = 0; i < Math.min(20, cases.length); i++) {
            const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = cases[i].input;
            const expected = cases[i].expected_output;
            
            const calculated = days * rate + miles * mileRate + receipts;
            const error = Math.abs(calculated - expected);
            totalError += error;
            testCount++;
        }
        
        const avgError = totalError / testCount;
        console.log(`Rate: $${rate}/day, $${mileRate}/mile, Avg Error: ${avgError.toFixed(2)}`);
    }
}

console.log('\nLooking for receipt multipliers:');

// Analyze if receipts are multiplied by some factor
for (let i = 0; i < Math.min(10, cases.length); i++) {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = cases[i].input;
    const expected = cases[i].expected_output;
    
    // Assume days * 120 + miles * 0.58 and see what multiplier receipts need
    const baseAmount = days * 120 + miles * 0.58;
    const receiptMultiplier = receipts > 0 ? (expected - baseAmount) / receipts : 0;
    
    console.log(`Case ${i + 1}: Base=${baseAmount.toFixed(2)}, Need=${(expected - baseAmount).toFixed(2)}, Multiplier=${receiptMultiplier.toFixed(2)}`);
}