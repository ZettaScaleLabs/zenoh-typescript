
//  ██████  ██████  ███    ██ ███████ ██  ██████  
// ██      ██    ██ ████   ██ ██      ██ ██       
// ██      ██    ██ ██ ██  ██ █████   ██ ██   ███ 
// ██      ██    ██ ██  ██ ██ ██      ██ ██    ██ 
//  ██████  ██████  ██   ████ ██      ██  ██████  

export class Config {
    /**
     * The configuration for a Zenoh Session.
     */
    locator: string

    private constructor(locator: string) {
        this.locator = locator
    }
    static async new(locator: string): Promise<Config> {

        return new Config(locator)
    }
}

