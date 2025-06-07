#!/usr/bin/env node

function calculateReimbursement(tripDays, miles, receipts) {
    const days = parseInt(tripDays);
    const milesTraveled = parseFloat(miles);
    const receiptAmount = parseFloat(receipts);
    
    // Different per-day rates based on trip length
    let perDayRate = 100; // Default rate
    
    if (days >= 14) {
        perDayRate = 60; // Very long trips get heavily reduced rate
    } else if (days >= 12) {
        perDayRate = 70; // Long trips get reduced rate
    } else if (days >= 10) {
        perDayRate = 80; // Medium-long trips get slightly reduced rate
    } else if (days >= 8) {
        perDayRate = 90; // Slightly reduced for 8-9 day trips
    }
    
    // Base calculation
    let reimbursement = days * perDayRate + milesTraveled * 0.58;
    
    // Receipt processing with different logic for long vs short trips
    let receiptContribution = 0;
    const spendingPerDay = receiptAmount / days;
    
    // For long trips (8+ days), spending per day affects receipt treatment
    if (days >= 8) {
        if (spendingPerDay < 100) {
            receiptContribution = receiptAmount * 0.46;
        } else if (spendingPerDay < 150) {
            receiptContribution = receiptAmount * 0.35;
        } else if (spendingPerDay < 200) {
            receiptContribution = receiptAmount * 0.29;
        } else if (spendingPerDay < 250) {
            receiptContribution = receiptAmount * 0.25;
        } else if (spendingPerDay < 300) {
            receiptContribution = receiptAmount * 0.22;
        } else {
            // Even very high spending gets some positive contribution
            receiptContribution = receiptAmount * 0.18;
        }
    } else {
        // Shorter trips use the original generous logic
        if (receiptAmount < 100) {
            receiptContribution = receiptAmount * 0.2;
        } else if (receiptAmount < 500) {
            receiptContribution = receiptAmount * 0.4;
        } else if (receiptAmount < 1000) {
            receiptContribution = receiptAmount * 0.5;
        } else if (receiptAmount < 1500) {
            receiptContribution = receiptAmount * 0.43;
        } else if (receiptAmount < 2000) {
            receiptContribution = receiptAmount * 0.32;
        } else {
            receiptContribution = receiptAmount * 0.23;
        }
    }
    
    reimbursement += receiptContribution;
    
    // Efficiency bonus
    const milesPerDay = milesTraveled / days;
    if (milesPerDay >= 50 && milesPerDay <= 150) {
        reimbursement += days * 5; // Small efficiency bonus
    }
    
    // Sweet spot bonus for 5-day trips
    if (days === 5) {
        reimbursement += 30;
    }
    
    // Small variance
    const hash = (days * 5 + Math.floor(milesTraveled) * 7 + Math.floor(receiptAmount * 100) * 3) % 30;
    reimbursement += (hash - 15) * 1.2;
    
    return Math.round(reimbursement * 100) / 100;
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length !== 3) {
        console.error('Usage: node calculate_reimbursement.js <trip_duration_days> <miles_traveled> <total_receipts_amount>');
        process.exit(1);
    }
    
    const [tripDays, miles, receipts] = args;
    const result = calculateReimbursement(tripDays, miles, receipts);
    
    console.log(result);
}

module.exports = { calculateReimbursement };