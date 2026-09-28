#!/bin/bash

while getopts k:h:s: flag
do
    case "${flag}" in
        k) key=${OPTARG};;
        h) hostname=${OPTARG};;
        s) service=${OPTARG};;
    esac
done

if [[ -z "$key" || -z "$hostname" || -z "$service" ]]; then
    printf "\nMissing required parameter.\n"
    printf "  syntax: deployFiles.sh -k <pem key file> -h <hostname> -s <service>\n\n"
    exit 1
fi

printf "\n----> Deploying files for $service to $hostname with $key\n"

# Step 1
printf "\n----> Clear out the previous distribution on the target.\n"
ssh -i "$key" ubuntu@$hostname << ENDSSH
rm -rf services/${service}/public
mkdir -p services/${service}/public
ENDSSH

# Step 2
# Only the site itself goes up. The repo docs (README, notes) and the simon-html
# folder stay local, since simon deploys separately with -s simon.
# nullglob drops any pattern with no matches, so adding a file type here before
# the project has one (like *.js right now) will not break the copy.
shopt -s nullglob
files=(*.html *.css *.js *.png *.jpg *.jpeg *.svg *.gif *.webp *.ico)
shopt -u nullglob

if [[ ${#files[@]} -eq 0 ]]; then
    printf "\nNo site files found. Run this from the startup directory.\n\n"
    exit 1
fi

printf "\n----> Copy the distribution package to the target.\n"
scp -i "$key" "${files[@]}" ubuntu@$hostname:services/$service/public
