seporator="_"
IFS=$seporator read -ra ADDR <<< "$1"
modelName=""
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

for i in "${ADDR[@]}"; do
    cap=$"$(tr '[:lower:]' '[:upper:]' <<< ${i:0:1})${i:1}"
    modelName=$modelName$cap
done

cat > $DIR/../models/$1.rb << EOF
class $modelName < ActiveRecord::Base
	
end
EOF

cat > $DIR/../db/migrate/$(date +%s)_create_$1.rb << EOF
class Create$modelName < ActiveRecord::Migration
	def change
		
	end
end
EOF