#!/usr/bin/env bash

envRequiredFile=".env.required_vars"

jqArgs=''

while read -r line
do
    if [ ! -z "${!line}" ]; then
        jqArgs+="OptionName=$line,Value=${!line},"
    fi
    
done < "$envRequiredFile"

# if [ ! -z $jqArgs ]; then
    echo $jqArgs
# fi

exit 0;