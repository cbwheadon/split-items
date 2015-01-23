var _ = require('underscore');

exports.Config = {
	config: {
	    awsKey: process.env.AWS_KEY,
	    awsRegion: process.env.AWS_REGION || "eu-west-1",
	    awsSecret: process.env.AWS_SECRET,
	    requestTimeout: (process.env.REQUEST_TIMEOUT || 1200000),
	    sqsQueue: (process.env.SQS_MARKING_QUEUE || 'marking'),
	    mongoUri: process.env.MONGO_MARKING_URI,
	    filePath: process.env.FILEPATH,
	    awsBucket: process.env.MARKING_BUCKET,
	    awsUploadBucket: process.env.UPLOAD_BUCKET,
	},

	/**
	 * Extend the default configuration settings
	 *
	 * @param object opts The new configration settings
	 *
	 * @return Config
	 */
	extend: function (opts) {
		this.config = _.extend(this.config, opts);
		return this;
	},

	/**
	 * Get all config settings
	 *
	 * @return object
	 */
	all: function () {
		return this.config;
	},

	/**
	 * Get a config value
	 *
	 * @param string name The config variable name
	 *
	 * @return mixed or null if not set
	 */
	get: function (name) {
		if (this.config[name]) {
			return this.config[name];
		}
		return null;
	},

	/**
	 * Add or update a config setting
	 *
	 * @param string name The config variable name
	 * @param mixed value The value
	 *
	 * @return Config
	 */
	set: function (name, value) {
		this.config[name] = value;
		return this;
	},

	/**
	 * Remove a config variable
	 *
	 * @param string name The config variable name
	 *
	 * @return Config
	 */
	remove: function (name) {
		if (this.config[name] !== undefined) {
			delete this.config[name];
		}
		return this;
	}
};
