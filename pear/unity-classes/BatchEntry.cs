//
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
//
// GENERATED USING @colyseus/schema 1.0.34
//

using Colyseus.Schema;

namespace FareProtocol.Schemas {
	public partial class BatchEntry : Schema {
		[Type(0, "number")]
		public float roundId = default(float);

		[Type(1, "number")]
		public float batchEntryId = default(float);

		[Type(2, "string")]
		public string player = default(string);

		[Type(3, "boolean")]
		public bool settled = default(bool);

		[Type(4, "string")]
		public string totalEntryAmount = default(string);

		[Type(5, "string")]
		public string totalMintAmount = default(string);

		[Type(6, "number")]
		public float timestamp = default(float);

		[Type(7, "array", typeof(ArraySchema<Entry>))]
		public ArraySchema<Entry> entries = new ArraySchema<Entry>();

		[Type(8, "boolean")]
		public bool isBurn = default(bool);
	}
}
