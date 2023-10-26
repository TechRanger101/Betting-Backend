// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

using Colyseus.Schema;

namespace FareProtocol.Schemas {
	public partial class SpinState : Schema {
		[Type(0, "map", typeof(MapSchema<GuestUser>))]
		public MapSchema<GuestUser> guestUsers = new MapSchema<GuestUser>();

		[Type(1, "map", typeof(MapSchema<User>))]
		public MapSchema<User> users = new MapSchema<User>();

		[Type(2, "map", typeof(MapSchema<BatchEntry>))]
		public MapSchema<BatchEntry> batchEntries = new MapSchema<BatchEntry>();

		[Type(3, "ref", typeof(Round))]
		public Round round = new Round();

		[Type(4, "string")]
		public string roomStatus = default(string);

		[Type(5, "string")]
		public string fareTotalSupply = default(string);

		[Type(6, "number")]
		public float currentRoundId = default(float);

		[Type(7, "boolean")]
		public bool isRoundPaused = default(bool);
	}
}
