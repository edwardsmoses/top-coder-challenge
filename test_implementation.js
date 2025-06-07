#!/usr/bin/env node

const fs = require('fs');
const { calculateReimbursement } = require('./calculate_reimbursement.js');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Testing implementation against public cases...\n');

let totalError = 0;
let testCount = 0;

for (let i = 0; i < Math.min(20, publicCases.length); i++) {
    const testCase = publicCases[i];
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const calculated = calculateReimbursement(days, miles, receipts);
    const error = Math.abs(calculated - expected);
    const errorPercent = (error / expected * 100).toFixed(2);
    
    totalError += error;
    testCount++;
    
    console.log(`Case ${i + 1}: Days=${days}, Miles=${miles}, Receipts=${receipts}`);
    console.log(`  Expected: ${expected}, Calculated: ${calculated}, Error: ${error.toFixed(2)} (${errorPercent}%)`);
    
    if (error > expected * 0.1) { // More than 10% error
        console.log(`  ⚠️  HIGH ERROR`);
    }
    console.log();
}

const avgError = totalError / testCount;
console.log(`Average error: ${avgError.toFixed(2)}`);
console.log(`Average error percentage: ${(avgError / (publicCases.slice(0, testCount).reduce((sum, c) => sum + c.expected_output, 0) / testCount) * 100).toFixed(2)}%`);