import { Translator } from '../core/translators/Translator';
import { writeFile } from 'fs/promises';
import * as ora from 'ora';
import { singleton } from 'tsyringe';
import { parseStringPromise } from 'xml2js';
import { js2xml, json2xml } from "xml-js";
import { Configuration } from '../core/config/Configuration';
import { IFurnitureData, IFurnitureType } from '../mapping/json';
import { FurnitureDataMapper } from '../mapping/mappers';
import { FileUtilities } from '../utils/FileUtilities';
import { items_base, PrismaClient } from '@prisma/client';
import { IItemsBase } from 'mapping/json/catalog/IItemsBase';
import { getDatabase } from '../main';
import { http } from '../core/TranslationService/TranslationService'

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
        const prisma = getDatabase();
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

        async function GetItems(): Promise<IItemsBase[]> {
            const furni: IItemsBase[] = await prisma.items_base.findMany({
                select: {
                item_name: true,
                id: true,
                },
            });
            return furni;
          }
           function updateitem(item: number, catalogname: string, offerid: number) {
               prisma.catalog_items.updateMany({
                  where: { 
                      item_ids: {
                      equals: item.toString()
                } },
                  data: { catalog_name: catalogname, offer_id: offerid },
                })
                
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
        
        const new_items: IFurnitureType[] = [...new_roomitems, ...new_wallitems]; 
        GetItems().then(items => {
            const changes:IItemsBase[] = new_items.map(furni =>
                items.find(furni2 => {if(furni.id === furni2.id){
                    furni2.item_name = furni.name;
                    furni2.offer_id = furni.offerid;
                    return furni2
                } 
                })
            );
            spinner.start("Translating catalog_items...")
            changes.forEach(async item => {
                if(item != null){
                spinner.text = (`Translating item: ${ item.id } - (${ item.item_name } OFFER_ID: ${ item.offer_id })`);
                spinner.render();
                 updateitem(item.id, item.item_name, item.offer_id);
                }
                 
            })
                
        }).catch((e) => {
              throw e
            }).finally(async () =>{
                await prisma.$disconnect().then(() => { spinner.succeed(`catalog_items updated in ${ Date.now() - now }ms`); })
                
            })
    }

    private async mapXML2JSON(xml: any): Promise<IFurnitureData>
    {
        if(!xml) return null;

        const output: IFurnitureData = {};

        FurnitureDataMapper.mapXML(xml, output);

        return output;
    }
}
