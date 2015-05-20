#!/bin/sh
seporator="_"
IFS=$seporator read -ra ADDR <<< "$1"
className=""
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

for i in "${ADDR[@]}"; do
    cap=$"$(tr '[:lower:]' '[:upper:]' <<< ${i:0:1})${i:1}"
    className=$className$cap
done

cat > $DIR/../db/migrate/$(date +%s)$seporator$1.rb << EOF
class $className < ActiveRecord::Migration
	def change
		
	end
end
EOF