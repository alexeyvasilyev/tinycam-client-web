// {"data":[{"time":1599146860000,"duration":136000,"motion":"motion","video":"\/Front yard\/2020-09-03 18.27.40 136sec motion.mp4",
// "image":"\/Front yard\/2020-09-03 18.27.40 136sec motion.mp4.jpg"}]}
export class EventRecord {
    time: number; // epoch
    motion: string; // 'motion', 'face', 'person', 'vehicle', 'pet', 'motion', 'audio'
    video: string;
    image?: string;
    duration: number; // msec
}
