include Paperclip::Schema

class CreateUserAndVideo < ActiveRecord::Migration
	def change
		create_table :user do |t|
			t.string :username
			t.string :password_digest
		end

		create_table :devices do |t|
			t.string :platform
			t.string :device_id
			t.string :user_id
		end

		create_table :videos do |t|
			t.integer :user_id
			t.string :url
			t.attachment :src
			t.string :tagline
			t.text :description
			t.timestamps
		end		
	end
end
