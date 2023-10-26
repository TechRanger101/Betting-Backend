//
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
//
// GENERATED USING @colyseus/schema 1.0.34
//

using Colyseus.Schema;

namespace FareProtocol.Schemas {
	public partial class Entry : Schema {
		[Type(0, "string")]
		public string amount = default(string);

		[Type(1, "number")]
		public float roundId = default(float);

		[Type(2, "number")]
		public float contractModeId = default(float);

		[Type(3, "number")]
		public float pickedNumber = default(float);

		[Type(4, "string")]
		public string player = default(string);

		[Type(5, "number")]
		public float entryIdx = default(float);

		[Type(6, "string")]
		public string mintAmount = default(string);

		[Type(7, "boolean")]
		public bool settled = default(bool);

		[Type(8, "boolean")]
		public bool isBurn = default(bool);
	}
}
