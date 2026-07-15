// Exercise media mapping — dataset: github.com/hasaneyldrm/exercises-dataset
// Media © Gymvisual (gymvisual.com) — licensed for that repo; production use requires Gymvisual license
// Self-hosted on Cloudflare R2 (bucket jcv-exercise-media) pending Gymvisual license for production use
const MEDIA_BASE = "https://media.jcv24fitness.com";

interface ExerciseMedia {
  image: string;
  gif: string;
}

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = {
  // PIERNAS
  // barbell full squat
  sentadilla: { image: `${MEDIA_BASE}/images/0043-qXTaZnJ.jpg`, gif: `${MEDIA_BASE}/videos/0043-qXTaZnJ.gif` },
  // smith sumo squat
  sentadilla_sumo: { image: `${MEDIA_BASE}/images/3142-dzz6BiV.jpg`, gif: `${MEDIA_BASE}/videos/3142-dzz6BiV.gif` },
  // dumbbell single leg split squat
  sentadilla_bulgara: { image: `${MEDIA_BASE}/images/0410-qx4fgX7.jpg`, gif: `${MEDIA_BASE}/videos/0410-qx4fgX7.gif` },
  // forward lunge (male)
  zancadas: { image: `${MEDIA_BASE}/images/3470-kMzUs9Y.jpg`, gif: `${MEDIA_BASE}/videos/3470-kMzUs9Y.gif` },
  // barbell lateral lunge
  zancada_lateral: { image: `${MEDIA_BASE}/images/1410-py1HSzx.jpg`, gif: `${MEDIA_BASE}/videos/1410-py1HSzx.gif` },
  // dumbbell rear lunge
  zancada_reversa: { image: `${MEDIA_BASE}/images/0381-SSsBDwB.jpg`, gif: `${MEDIA_BASE}/videos/0381-SSsBDwB.gif` },
  // barbell deadlift
  peso_muerto: { image: `${MEDIA_BASE}/images/0032-ila4NZS.jpg`, gif: `${MEDIA_BASE}/videos/0032-ila4NZS.gif` },
  // barbell romanian deadlift
  peso_muerto_rumano: { image: `${MEDIA_BASE}/images/0085-wQ2c4XD.jpg`, gif: `${MEDIA_BASE}/videos/0085-wQ2c4XD.gif` },
  // bodyweight standing calf raise
  elevacion_talones: { image: `${MEDIA_BASE}/images/1373-bJYHBIN.jpg`, gif: `${MEDIA_BASE}/videos/1373-bJYHBIN.gif` },
  // barbell glute bridge
  puente_gluteo: { image: `${MEDIA_BASE}/images/1409-qKBpF7I.jpg`, gif: `${MEDIA_BASE}/videos/1409-qKBpF7I.gif` },
  // barbell glute bridge two legs on bench (male)
  hip_thrust: { image: `${MEDIA_BASE}/images/3562-qg2PGl6.jpg`, gif: `${MEDIA_BASE}/videos/3562-qg2PGl6.gif` },
  // band bent-over hip extension
  patada_gluteo: { image: `${MEDIA_BASE}/images/0980-wSScovH.jpg`, gif: `${MEDIA_BASE}/videos/0980-wSScovH.gif` },
  // jump squat
  sentadilla_salto: { image: `${MEDIA_BASE}/images/0514-LIlE5Tn.jpg`, gif: `${MEDIA_BASE}/videos/0514-LIlE5Tn.gif` },
  // dumbbell step-up
  step_up: { image: `${MEDIA_BASE}/images/0431-aXtJhlg.jpg`, gif: `${MEDIA_BASE}/videos/0431-aXtJhlg.gif` },
  // sled 45в° leg press
  prensa: { image: `${MEDIA_BASE}/images/0739-10Z2DXU.jpg`, gif: `${MEDIA_BASE}/videos/0739-10Z2DXU.gif` },
  // lever leg extension
  extension_pierna: { image: `${MEDIA_BASE}/images/0585-my33uHU.jpg`, gif: `${MEDIA_BASE}/videos/0585-my33uHU.gif` },
  // lever lying leg curl
  curl_femoral: { image: `${MEDIA_BASE}/images/0586-17lJ1kr.jpg`, gif: `${MEDIA_BASE}/videos/0586-17lJ1kr.gif` },
  // PECHO
  // push-up
  flexiones: { image: `${MEDIA_BASE}/images/0662-I4hDWkc.jpg`, gif: `${MEDIA_BASE}/videos/0662-I4hDWkc.gif` },
  // kneeling push-up (male)
  flexiones_rodillas: { image: `${MEDIA_BASE}/images/3211-ZOuKWir.jpg`, gif: `${MEDIA_BASE}/videos/3211-ZOuKWir.gif` },
  // incline push-up
  flexiones_inclinadas: { image: `${MEDIA_BASE}/images/0493-B1EVP9F.jpg`, gif: `${MEDIA_BASE}/videos/0493-B1EVP9F.gif` },
  // decline push-up
  flexiones_declinadas: { image: `${MEDIA_BASE}/images/0279-i5cEhka.jpg`, gif: `${MEDIA_BASE}/videos/0279-i5cEhka.gif` },
  // diamond push-up
  flexiones_diamante: { image: `${MEDIA_BASE}/images/0283-soIB2rj.jpg`, gif: `${MEDIA_BASE}/videos/0283-soIB2rj.gif` },
  // wide hand push up
  flexiones_anchas: { image: `${MEDIA_BASE}/images/1311-JmMVpR3.jpg`, gif: `${MEDIA_BASE}/videos/1311-JmMVpR3.gif` },
  // barbell bench press
  press_banca: { image: `${MEDIA_BASE}/images/0025-EIeI8Vf.jpg`, gif: `${MEDIA_BASE}/videos/0025-EIeI8Vf.gif` },
  // dumbbell bench press
  press_mancuernas: { image: `${MEDIA_BASE}/images/0289-SpYC0Kp.jpg`, gif: `${MEDIA_BASE}/videos/0289-SpYC0Kp.gif` },
  // dumbbell incline bench press
  press_inclinado: { image: `${MEDIA_BASE}/images/0314-ns0SIbU.jpg`, gif: `${MEDIA_BASE}/videos/0314-ns0SIbU.gif` },
  // dumbbell fly
  aperturas: { image: `${MEDIA_BASE}/images/0308-yz9nUhF.jpg`, gif: `${MEDIA_BASE}/videos/0308-yz9nUhF.gif` },
  // dumbbell pullover
  pullover: { image: `${MEDIA_BASE}/images/0375-9XjtHvS.jpg`, gif: `${MEDIA_BASE}/videos/0375-9XjtHvS.gif` },
  // chest dip
  fondos_pecho: { image: `${MEDIA_BASE}/images/0251-9WTm7dq.jpg`, gif: `${MEDIA_BASE}/videos/0251-9WTm7dq.gif` },
  // ESPALDA
  // pull-up
  dominadas: { image: `${MEDIA_BASE}/images/0652-lBDjFxJ.jpg`, gif: `${MEDIA_BASE}/videos/0652-lBDjFxJ.gif` },
  // band assisted pull-up
  dominadas_asistidas: { image: `${MEDIA_BASE}/images/0970-r1XNRYB.jpg`, gif: `${MEDIA_BASE}/videos/0970-r1XNRYB.gif` },
  // pull up (neutral grip)
  dominadas_neutras: { image: `${MEDIA_BASE}/images/0651-0V2YQjW.jpg`, gif: `${MEDIA_BASE}/videos/0651-0V2YQjW.gif` },
  // dumbbell one arm bent-over row
  remo_mancuerna: { image: `${MEDIA_BASE}/images/0292-C0MA9bC.jpg`, gif: `${MEDIA_BASE}/videos/0292-C0MA9bC.gif` },
  // barbell bent over row
  remo_barra: { image: `${MEDIA_BASE}/images/0027-eZyBC3j.jpg`, gif: `${MEDIA_BASE}/videos/0027-eZyBC3j.gif` },
  // inverted row
  remo_invertido: { image: `${MEDIA_BASE}/images/0499-bZGHsAZ.jpg`, gif: `${MEDIA_BASE}/videos/0499-bZGHsAZ.gif` },
  // lower back curl
  superman: { image: `${MEDIA_BASE}/images/1352-ANbbry2.jpg`, gif: `${MEDIA_BASE}/videos/1352-ANbbry2.gif` },
  // cable standing rear delt row (with rope)
  face_pull: { image: `${MEDIA_BASE}/images/0233-ZfyAGhK.jpg`, gif: `${MEDIA_BASE}/videos/0233-ZfyAGhK.gif` },
  // cable pulldown
  jalon_polea: { image: `${MEDIA_BASE}/images/0198-RVwzP10.jpg`, gif: `${MEDIA_BASE}/videos/0198-RVwzP10.gif` },
  // cable seated row
  remo_polea: { image: `${MEDIA_BASE}/images/0861-fUBheHs.jpg`, gif: `${MEDIA_BASE}/videos/0861-fUBheHs.gif` },
  // dumbbell shrug
  encogimientos: { image: `${MEDIA_BASE}/images/0406-NJzBsGJ.jpg`, gif: `${MEDIA_BASE}/videos/0406-NJzBsGJ.gif` },
  // BRAZOS
  // dumbbell biceps curl
  curl_bicep: { image: `${MEDIA_BASE}/images/0294-NbVPDMW.jpg`, gif: `${MEDIA_BASE}/videos/0294-NbVPDMW.gif` },
  // dumbbell hammer curl
  curl_martillo: { image: `${MEDIA_BASE}/images/0313-slDvUAU.jpg`, gif: `${MEDIA_BASE}/videos/0313-slDvUAU.gif` },
  // dumbbell concentration curl
  curl_concentrado: { image: `${MEDIA_BASE}/images/0297-gvsWLQw.jpg`, gif: `${MEDIA_BASE}/videos/0297-gvsWLQw.gif` },
  // bench dip (knees bent)
  tricep_fondos: { image: `${MEDIA_BASE}/images/0129-RrLske5.jpg`, gif: `${MEDIA_BASE}/videos/0129-RrLske5.gif` },
  // dumbbell kickback
  extension_tricep: { image: `${MEDIA_BASE}/images/0333-W6PxUkg.jpg`, gif: `${MEDIA_BASE}/videos/0333-W6PxUkg.gif` },
  // dumbbell standing triceps extension
  tricep_overhead: { image: `${MEDIA_BASE}/images/0430-PdmaD0N.jpg`, gif: `${MEDIA_BASE}/videos/0430-PdmaD0N.gif` },
  // barbell lying triceps extension skull crusher
  press_frances: { image: `${MEDIA_BASE}/images/0060-h8LFzo9.jpg`, gif: `${MEDIA_BASE}/videos/0060-h8LFzo9.gif` },
  // dumbbell standing overhead press
  press_militar: { image: `${MEDIA_BASE}/images/0426-A6wtbuL.jpg`, gif: `${MEDIA_BASE}/videos/0426-A6wtbuL.gif` },
  // dumbbell lateral raise
  elevaciones_laterales: { image: `${MEDIA_BASE}/images/0334-DsgkuIt.jpg`, gif: `${MEDIA_BASE}/videos/0334-DsgkuIt.gif` },
  // dumbbell front raise
  elevaciones_frontales: { image: `${MEDIA_BASE}/images/0310-3eGE2JC.jpg`, gif: `${MEDIA_BASE}/videos/0310-3eGE2JC.gif` },
  // dumbbell reverse fly
  pajaros: { image: `${MEDIA_BASE}/images/0383-EAs3xL9.jpg`, gif: `${MEDIA_BASE}/videos/0383-EAs3xL9.gif` },
  // dumbbell seated palms up wrist curl
  curl_muneca: { image: `${MEDIA_BASE}/images/0401-2dImyQ8.jpg`, gif: `${MEDIA_BASE}/videos/0401-2dImyQ8.gif` },
  // CORE
  // weighted front plank
  plancha: { image: `${MEDIA_BASE}/images/2135-VBAWRPG.jpg`, gif: `${MEDIA_BASE}/videos/2135-VBAWRPG.gif` },
  // side bridge v. 2
  plancha_lateral: { image: `${MEDIA_BASE}/images/0705-RKjH6Lt.jpg`, gif: `${MEDIA_BASE}/videos/0705-RKjH6Lt.gif` },
  // crunch floor
  crunch: { image: `${MEDIA_BASE}/images/0274-TFqbd8t.jpg`, gif: `${MEDIA_BASE}/videos/0274-TFqbd8t.gif` },
  // air bike
  crunch_bicicleta: { image: `${MEDIA_BASE}/images/0003-1ZFqTDN.jpg`, gif: `${MEDIA_BASE}/videos/0003-1ZFqTDN.gif` },
  // reverse crunch
  crunch_inverso: { image: `${MEDIA_BASE}/images/0872-nCU1Ekp.jpg`, gif: `${MEDIA_BASE}/videos/0872-nCU1Ekp.gif` },
  // hanging straight leg raise
  elevacion_piernas: { image: `${MEDIA_BASE}/images/0475-4Ml7QFO.jpg`, gif: `${MEDIA_BASE}/videos/0475-4Ml7QFO.gif` },
  // russian twist
  russian_twist: { image: `${MEDIA_BASE}/images/0687-XVDdcoj.jpg`, gif: `${MEDIA_BASE}/videos/0687-XVDdcoj.gif` },
  // mountain climber
  mountain_climber: { image: `${MEDIA_BASE}/images/0630-RJgzwny.jpg`, gif: `${MEDIA_BASE}/videos/0630-RJgzwny.gif` },
  // dead bug
  dead_bug: { image: `${MEDIA_BASE}/images/0276-iny3m5y.jpg`, gif: `${MEDIA_BASE}/videos/0276-iny3m5y.gif` },
  // jackknife sit-up
  v_ups: { image: `${MEDIA_BASE}/images/0507-mbkgB44.jpg`, gif: `${MEDIA_BASE}/videos/0507-mbkgB44.gif` },
  // wheel rollerout
  ab_wheel: { image: `${MEDIA_BASE}/images/0857-NAgVB3t.jpg`, gif: `${MEDIA_BASE}/videos/0857-NAgVB3t.gif` },
  // CARDIO
  // burpee
  burpees: { image: `${MEDIA_BASE}/images/1160-dK9394r.jpg`, gif: `${MEDIA_BASE}/videos/1160-dK9394r.gif` },
  // jack jump (male)
  jumping_jacks: { image: `${MEDIA_BASE}/images/3224-1g5bPpA.jpg`, gif: `${MEDIA_BASE}/videos/3224-1g5bPpA.gif` },
  // jump rope
  saltar_cuerda: { image: `${MEDIA_BASE}/images/2612-e1e76I2.jpg`, gif: `${MEDIA_BASE}/videos/2612-e1e76I2.gif` },
  // run
  sprint: { image: `${MEDIA_BASE}/images/0685-oLrKqDH.jpg`, gif: `${MEDIA_BASE}/videos/0685-oLrKqDH.gif` },
  // skater hops
  skaters: { image: `${MEDIA_BASE}/images/3361-zfNHMN9.jpg`, gif: `${MEDIA_BASE}/videos/3361-zfNHMN9.gif` },
  // battling ropes
  battle_ropes: { image: `${MEDIA_BASE}/images/0128-RJa4tCo.jpg`, gif: `${MEDIA_BASE}/videos/0128-RJa4tCo.gif` },
  // CUERPO COMPLETO
  // kettlebell swing
  kettlebell_swing: { image: `${MEDIA_BASE}/images/0549-UHJlbu3.jpg`, gif: `${MEDIA_BASE}/videos/0549-UHJlbu3.gif` },
  // barbell clean and press
  clean_press: { image: `${MEDIA_BASE}/images/0028-SGY8Zui.jpg`, gif: `${MEDIA_BASE}/videos/0028-SGY8Zui.gif` },
  // barbell thruster
  thruster: { image: `${MEDIA_BASE}/images/3305-f7Y9eDZ.jpg`, gif: `${MEDIA_BASE}/videos/3305-f7Y9eDZ.gif` },
  // kettlebell turkish get up (squat style)
  turkish_getup: { image: `${MEDIA_BASE}/images/0551-Ha7SZ3y.jpg`, gif: `${MEDIA_BASE}/videos/0551-Ha7SZ3y.gif` },
  // bear crawl
  bear_crawl: { image: `${MEDIA_BASE}/images/3360-0Yz8WdV.jpg`, gif: `${MEDIA_BASE}/videos/3360-0Yz8WdV.gif` },
  // inchworm
  inchworm: { image: `${MEDIA_BASE}/images/1471-ZgsNQ6d.jpg`, gif: `${MEDIA_BASE}/videos/1471-ZgsNQ6d.gif` },
  // farmers walk
  farmers_walk: { image: `${MEDIA_BASE}/images/2133-qPEzJjA.jpg`, gif: `${MEDIA_BASE}/videos/2133-qPEzJjA.gif` },
  // kettlebell thruster
  squat_press: { image: `${MEDIA_BASE}/images/0550-yWxMvB5.jpg`, gif: `${MEDIA_BASE}/videos/0550-yWxMvB5.gif` },
};

export function getExerciseMedia(exerciseId: string): ExerciseMedia | undefined {
  return EXERCISE_MEDIA[exerciseId];
}
