const art:Record<string,string>={
 trader:'  .----.\n / $  $ \\n|   <>   |\n|  ----  |\n \\  __  /\n  /|  |\\\n  /_||_\\',
 worker:'  .----.\n / -  - \\n|   __   |\n|  ____  |\n \\______/\n  /|  |\\\n  /_||_\\',
 family:'  .----.\n / ^  ^ \\n|   \\/   |\n|  ____  |\n \\______/\n  /|  |\\\n  /_||_\\',
 wildcard:'  .----.\n / ?  ! \\n|   <>   |\n|  ~~~~  |\n \\______/\n  /|  |\\\n  /_||_\\'
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
