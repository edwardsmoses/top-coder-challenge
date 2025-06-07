#!/bin/bash

# Black Box Challenge - Node.js Implementation
# This script takes three parameters and outputs the reimbursement amount
# Usage: ./run.sh <trip_duration_days> <miles_traveled> <total_receipts_amount>

node calculate_reimbursement.js "$1" "$2" "$3"