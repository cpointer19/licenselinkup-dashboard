export interface MapContact {
  name: string;
  role: string;
  state: string;
  zip: string;
  agentsLicense: string;
  brokerageLicense: string;
  licenseVerified: string;
  email: string;
  foundingMemberStatus: string;
  notes: string;
  lat: number;
  lng: number;
}

export const MAP_CONTACTS: MapContact[] = [
  { name: "Sabrina Simpson", role: "Agent", state: "California", zip: "93021", agentsLicense: "1244705", brokerageLicense: "1912687", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 34.2849574, lng: -118.8675982 },
  { name: "Tawanda Gresham", role: "Broker", state: "Georgia", zip: "30045", agentsLicense: "277688", brokerageLicense: "75813", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 33.9378763, lng: -83.9767666 },
  { name: "Bill Barbee", role: "Broker", state: "North Carolina", zip: "28027", agentsLicense: "171309", brokerageLicense: "C39959", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 35.403685, lng: -80.6671374 },
  { name: "Harry Jean-Baptiste", role: "Agent", state: "Texas", zip: "77002", agentsLicense: "695124", brokerageLicense: "9003138", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 29.7562736, lng: -95.3658572 },
  { name: "Dwayne Saunders", role: "Agent", state: "Florida", zip: "32819", agentsLicense: "SL3636921", brokerageLicense: "", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 28.4570028, lng: -81.4616989 },
  { name: "David Nealy", role: "Broker", state: "California", zip: "90017", agentsLicense: "2305870", brokerageLicense: "2305870", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 34.0499167, lng: -118.262347 },
  { name: "Robert Wilson", role: "Broker", state: "California", zip: "92867", agentsLicense: "906179", brokerageLicense: "", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 33.8114983, lng: -117.8220667 },
  { name: "Travis Old", role: "Agent", state: "North Carolina", zip: "27958", agentsLicense: "334264", brokerageLicense: "", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 36.4992717, lng: -76.1418362 },
  { name: "Jose Carias", role: "Agent", state: "Georgia", zip: "30024", agentsLicense: "407838", brokerageLicense: "H-60097", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 34.062925, lng: -84.0960096 },
  { name: "Christopher Rosado Torres", role: "Agent", state: "North Carolina", zip: "27519", agentsLicense: "329314", brokerageLicense: "C32455", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 35.7981794, lng: -78.8809475 },
  { name: "Vera Lupian", role: "Agent", state: "California", zip: "93291", agentsLicense: "1359507", brokerageLicense: "", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 36.3494345, lng: -119.3330449 },
  { name: "Adam Scherr", role: "Agent", state: "California", zip: "90004", agentsLicense: "1925644", brokerageLicense: "1925644", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 34.0739664, lng: -118.3006391 },
  { name: "Martha Novetske", role: "Agent", state: "Indiana", zip: "46342", agentsLicense: "RB22000091", brokerageLicense: "RC17000020", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 41.5317502, lng: -87.2637796 },
  { name: "Leo Bryan", role: "Agent", state: "California", zip: "91303", agentsLicense: "2115498", brokerageLicense: "", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 34.1969691, lng: -118.601882 },
  { name: "Irma L Hernandez", role: "Agent", state: "Illinois", zip: "60073", agentsLicense: "475.180496", brokerageLicense: "477.012421", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 42.3561571, lng: -88.1046877 },
  { name: "Debbie Mcclain", role: "Agent", state: "Texas", zip: "76110", agentsLicense: "0565291SA", brokerageLicense: "9016210BB", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 32.7099365, lng: -97.338255 },
  { name: "Ben Ward", role: "Agent", state: "Florida", zip: "32550", agentsLicense: "Bk3385350", brokerageLicense: "", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 30.3840906, lng: -86.3496678 },
  { name: "Ken Burningham", role: "Agent", state: "Florida", zip: "33837", agentsLicense: "BK3356751", brokerageLicense: "CQ1053484", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 28.2199762, lng: -81.5925007 },
  { name: "Vickie Fageol", role: "Agent", state: "California", zip: "92021", agentsLicense: "1423274", brokerageLicense: "1878277", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 32.8233833, lng: -116.9106882 },
  { name: "David Perry", role: "Broker", state: "California", zip: "90706", agentsLicense: "572110", brokerageLicense: "572110", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 33.8874136, lng: -118.1312402 },
  { name: "David Hittle", role: "Agent", state: "Kentucky", zip: "40065", agentsLicense: "251319", brokerageLicense: "179699", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 38.1958172, lng: -85.2295223 },
  { name: "Michelle Keefe", role: "Agent", state: "North Carolina", zip: "28079", agentsLicense: "337924", brokerageLicense: "C22682", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 35.0794188, lng: -80.6301087 },
  { name: "Jamie Quinn", role: "Broker", state: "Texas", zip: "77380", agentsLicense: "457981", brokerageLicense: "457981", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 30.1471224, lng: -95.4662484 },
  { name: "Jose Alves", role: "Agent", state: "Texas", zip: "77433", agentsLicense: "672341", brokerageLicense: "672341", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 29.9725639, lng: -95.7333398 },
  { name: "David Allen Rivas", role: "Broker", state: "California", zip: "94086", agentsLicense: "1841683", brokerageLicense: "1841683", licenseVerified: "", email: "", foundingMemberStatus: "", notes: "", lat: 37.3730669, lng: -122.022753 },
];
