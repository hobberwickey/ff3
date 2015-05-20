var MOT = function(data){
	this.data = data || [];
	this.form = document.querySelector("importer-form");

	if (this.form !== null){
		this.form.data = this.data;
	}
}