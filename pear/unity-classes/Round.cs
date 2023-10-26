// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

using Colyseus.Schema;

namespace FareProtocol.Schemas {
	public partial class Round : Schema {
		[Type(0, "number")]
		public float roundId = default(float);

		[Type(1, "number")]
		public float randomNum = default(float);

		[Type(2, "string")]
		public string randomEliminator = default(string);

		[Type(3, "string")]
		public string vrfRequestId = default(string);

		[Type(4, "boolean")]
		public bool isTwoXElim = default(bool);

		[Type(5, "boolean")]
		public bool isTenXElim = default(bool);

		[Type(6, "boolean")]
		public bool isHundoXElim = default(bool);
	}
}
