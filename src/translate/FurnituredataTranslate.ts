import { Translator } from '../core/translators/Translator';
import { writeFile } from 'fs/promises';
import * as ora from 'ora';
import { singleton } from 'tsyringe';
import { parseStringPromise } from 'xml2js';
import { js2xml, json2xml } from "xml-js";
import { Configuration } from '../core/config/Configuration';
import { IFurnitureData } from '../mapping/json';
import { FurnitureDataMapper } from '../mapping/mappers';
import { FileUtilities } from '../utils/FileUtilities';

@singleton()
export class FurnitureDataTranslate extends Translator
{
    public furnitureDataFrom: IFurnitureData = null;
    public furnitureDataTo: IFurnitureData = null;
    constructor(
        private readonly _configuration: Configuration)
    {
        super();
    }

    public async convertAsync(args: string[] = []): Promise<void>
    {
        const now = Date.now();
        const spinner = ora('Preparing FurnitureData').start();

        const FROM = this._configuration.getValue('furnidata-from.load.url');
        const TO = this._configuration.getValue('furnidata-to.load.url');
        const content2 = await FileUtilities.readFileAsString(FROM);
        const content = await FileUtilities.readFileAsString(TO);
        if(content2 == null){
            spinner.fail(`FurnitureData [FROM] not found`);
            return;
        }
        if(!content2.startsWith('{'))
        {
            const xml = await parseStringPromise(content2.replace(/&/g,'&amp;'));
            const furnitureDataFrom = await this.mapXML2JSON(xml);

            this.furnitureDataFrom = furnitureDataFrom;
        }
        else
        {
            this.furnitureDataFrom = JSON.parse(content2);
        }

        if(content == null){
            spinner.fail(`FurnitureData [TO] not found`);
            return;
        }
        if(!content.startsWith('{'))
        {
            const xml = await parseStringPromise(content.replace(/&/g,'&amp;'));
            const furnitureDataTo = await this.mapXML2JSON(xml);

            this.furnitureDataTo = furnitureDataTo;
        }
        else
        {
            this.furnitureDataTo = JSON.parse(content);
        }

        const new_roomitems = this.furnitureDataTo.roomitemtypes.furnitype.map(furni =>  this.furnitureDataFrom.roomitemtypes.furnitype.find(furni2 => furni.classname === furni2.classname) || furni);
        const new_wallitems = this.furnitureDataTo.wallitemtypes.furnitype.map(furni =>  this.furnitureDataFrom.wallitemtypes.furnitype.find(furni2 => furni.classname === furni2.classname) || furni);
        this.furnitureDataTo.roomitemtypes.furnitype = new_roomitems;
        this.furnitureDataTo.wallitemtypes.furnitype = new_wallitems;


        const directory = FileUtilities.getDirectory(this._configuration.getValue('output.folder'), 'gamedata');
        const json = directory.path + '/FurnitureData.json';
        const xml = directory.path + '/Furnidata.xml';
        let xmls = js2xml(this.furnitureDataTo, {
            compact: true, spaces: 1
          });
                  xmls = `<?xml version="1.0" encoding="UTF-8"?>
<furnidata>
%furnidata%
</furnidata>`.replace("%furnidata%", xmls);
        await writeFile(json, JSON.stringify(this.furnitureDataTo), 'utf8');
        await writeFile(xml, xmls, 'utf8');
        spinner.succeed(`FurnitureData finished in ${ Date.now() - now }ms`);
    }

    private async mapXML2JSON(xml: any): Promise<IFurnitureData>
    {
        if(!xml) return null;

        const output: IFurnitureData = {};

        FurnitureDataMapper.mapXML(xml, output);

        return output;
    }
}
