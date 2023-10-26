#!/usr/bin/env bash

echo $CI_PROJECT_DIR
echo $envRequiredFile
envRequiredFile="$CI_PROJECT_DIR/.env.required_vars"
while read -r line
do
    if [[ "$line" != \#* ]]; then
        echo "[ENV] Checking for $line";

        if [ -z "${!line}" ]; then
            echo "[ENV] $line is unset";
            exit 1;
        else
            echo "[ENV] $line is set";
        fi
    fi

done < "$envRequiredFile"

echo "[ENV] Correct environment variables are present."
exit 0;
