
const packageSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        percentage: {
            type: String,
            required: true,
        },
        hours: {
            type: Number,
        },

        days: {
            type: Number,
        },

        minimum: {
            type: Number
        },
        maximum: {
            type: Number
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('packages', packageSchema)
