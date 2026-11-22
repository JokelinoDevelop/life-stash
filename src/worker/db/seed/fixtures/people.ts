/** Other accounts and invites, so Settings › People has something to show. */
export const DEMO_PEOPLE = {
  /** In the demo household (shares its data); no password, so they can't sign in locally. */
  member: { displayName: "Mila", email: "mila@lifestash.dev" },
  /** A separate household of their own. */
  separate: {
    displayName: "Stefan",
    email: "stefan@lifestash.dev",
    householdName: "Stefan's home",
  },
  invites: [
    { joinDemoHousehold: false, name: "Ana" },
    { joinDemoHousehold: true, name: null },
  ],
} as const;
