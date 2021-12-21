import { singleton } from 'tsyringe';
import * as configuration from '../../configuration.json';

@singleton()
export class Configuration
{
    private readonly _config: Map<string, string>;

    constructor()
    {
        this._config = new Map<string, string>();
    }

    public async init(): Promise<void>
    {
        this.parseConfiguration(configuration);
    }

    private parseConfiguration(content: Object): boolean
    {
        if(!content) return false;

        try
        {
            const regex = new RegExp(/\${(.*?)}/g);

            for(const key of Object.keys(configuration))
            {
                if(this._config.get(key))
                {
                    if(!configuration[key].length) continue;
                }

                this._config.set(key, this.interpolate(configuration[key], regex));
            }

            return true;
        }

        catch (e)
        {
            console.log();
            console.error(e);

            return false;
        }
    }

    public interpolate(value: string, regex: RegExp = null): string
    {
        if(!regex) regex = new RegExp(/\${(.*?)}/g);

        const pieces = value.match(regex);

        if(pieces && pieces.length)
        {
            for(const piece of pieces)
            {
                const existing = this._config.get(this.removeInterpolateKey(piece));

                if(existing) (value = value.replace(piece, existing));
            }
        }

        return value;
    }

    private removeInterpolateKey(value: string): string
    {
        return value.replace('${', '').replace('}', '');
    }

    public getValue(key: string, value: string = ''): string
    {
        if(this._config.has(key)) return this._config.get(key);

        return value;
    }

    public setValue(key: string, value: string): void
    {
        this._config.set(key, value);
    }

    public getBoolean(key: string): boolean
    {
        const value = this.getValue(key);

        return ((value === 'true') || (value === '1'));
    }
}
