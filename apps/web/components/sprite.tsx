const art: Record<string, string> = {
  trader: String.raw`  .----.
 / $  $ \
|   <>   |
|  ----  |
 \  __  /
  /|  |\
  /_||_\ `,
  worker: String.raw`  .----.
 / -  - \
|   __   |
|  ____  |
 \______/
  /|  |\
  /_||_\ `,
  family: String.raw`  .----.
 / ^  ^ \
|   \/   |
|  ____  |
 \______/
  /|  |\
  /_||_\ `,
  wildcard: String.raw`  .----.
 / ?  ! \
|   <>   |
|  ~~~~  |
 \______/
  /|  |\
  /_||_\ `
};
export function Sprite({role='wildcard',large=false}:{role?:string;large?:boolean}){return <pre className={`sprite${large?' large':''}`} aria-label={`${role} agent illustration`}>{art[role]??art.wildcard}</pre>}
export const heroArt=`
            .----.
         .-'  _   '-.
        /    (.) (.) \\
       |  .      ^    |
       |  |   .---.   |
        \\  \\  '---'  /
         '-. '-----' .-'
            |  :::  |
        .---'  :::  '---.
       /       :::       \\
      /   /|   :::   |\\   \\
         / |   :::   | \\
           |___:::___|
            /  | |  \\
           /___| |___\\
`;
