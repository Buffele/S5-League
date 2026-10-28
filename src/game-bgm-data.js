// Authenticated EU defaults: language/_eu_default_option.x7, CRC 7df0bcdf.
// SHA256 204b02b3b2b90b2f4c976b293ba25c61832fbad13a5bc31e3be6ca8dab97f644.
// Native PE 6bea9d8c…: 6F1830 resolves map IDs/slots, 6F1420 selects the
// next queued index; B6C530/B6DA60 advance a completed map track.
// Evidence, original bytes and remaining gates: work/s5runtime-inventory-recovery/bgm-recovery.
export const BGM_SOURCE = Object.freeze({
  defaultXml: 'language/_eu_default_option.x7', crc32: '7df0bcdf',
  sha256: '204b02b3b2b90b2f4c976b293ba25c61832fbad13a5bc31e3be6ca8dab97f644',
  nativeReady: false,
});

export const BGM_TRACKS = Object.freeze({
  CONQUEST_MAP46: Object.freeze({key:'CONQUEST_MAP46', path:'bgm/battle2.ogg', crc32:'27a7d63c', sha256:'f0b9ce6fad28485e60c760a1744b73d2d73c393183fb83c20d8d9bb9e944dff5'}),
  OP_0030: Object.freeze({key:'OP_0030', path:'bgm/battle4.ogg', crc32:'df6e7f11', sha256:'5dfcefab7c8711f2adc565f982cf7a3888831dbea73ad484fb8fbf53b829a6f8'}),
  OP_0039: Object.freeze({key:'OP_0039', path:'bgm/syriana_s4.ogg', crc32:'a760e859', sha256:'e4a6a931b35105367f8295a76e37cae3fc8bc3f1d04e5e1017702410c7bfe370'}),
});

const station2 = Object.freeze({key:'map:66', nativeMapId:66, tracks:Object.freeze(['OP_0030','OP_0039']),
  selection:'native-default-slot-order', repeatPlaylist:true, bufferLoop:false,
  source:'EU map66; AC78D0 initializes random=false; 6F1420 refills the consumed index queue'});

// Map46 has no EU jukebox row. Its own authenticated INI supplies this track.
// Repeating the sole track follows S5's map lifecycle, not an observed native
// map46 queue. Evidence: conquest-recovery/map-music-20261022.json.
const conquest = Object.freeze({key:'map:46', nativeMapId:46, tracks:Object.freeze(['CONQUEST_MAP46']),
  selection:'authored-map-ini',repeatPlaylist:true,bufferLoop:false,
  source:'mapinfo/bginfo-wave_middle.ini [BGM] bgm_1=Bgm/battle2.ogg',nativePlaybackObserved:false});

export function resolveBgmRoute(route) {
  if (route?.kind === 'map' && route.nativeMapId === 46) return conquest;
  if (route?.kind === 'map' && route.nativeMapId === 66) return station2;
  if (route?.kind === 'map') return Object.freeze({key:`map:${route.nativeMapId ?? 'unknown'}`, tracks:Object.freeze([]),
    reason:route.nativeMapId === 93 ? 'native-map-93-bgm-not-established' : 'native-map-bgm-not-established'});
  // The recovered map0 consumer is real; its exact menu lifecycle is still open.
  // wait.ogg has a separate caller and is not substituted for the main menu.
  return Object.freeze({key:route?.kind === 'menu' ? 'menu' : 'unknown', tracks:Object.freeze([]), reason:'native-menu-bgm-not-established'});
}
