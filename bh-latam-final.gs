let _form_url = "url to form";
let _form = FormApp.openByUrl(_form_url)
let _ws_url = "url to doc"

function clearForm(){
  // remove generated items
  Logger.log("Removing dynamic controls...");
  _form.getItems().filter(x => x.getType() == FormApp.ItemType.LIST).forEach(x => { _form.deleteItem(x)});
  _form.getItems().filter(x => x.getType() == FormApp.ItemType.GRID).forEach(x => { _form.deleteItem(x)});
  _form.getItems().filter(x => x.getType() == FormApp.ItemType.CHECKBOX).forEach(x => { _form.deleteItem(x)});

  _form.getItems().filter(x => x.getType() == FormApp.ItemType.IMAGE).forEach((x, i) => {
    if(i > 0) _form.deleteItem(x);
  });
  Logger.log("[OK] ");
}

function deleteAllResponces(){
    _form.deleteAllResponses();
}

function clear_and_setup(){
  clearForm();
  setupForm();
}

function setupForm() {
  let ws = SpreadsheetApp.openByUrl(_ws_url);

  let judges = getTableByName(ws, "Judges").map(row => [row[0], row[2]]);
  let categoryPairs = getTableByName(ws, "Categories");
  let candidates =  getTableByName(ws, "Candidates");

  Logger.log(`Fetched ${candidates.length} items...`);
  
  let sections = _form.getItems().filter(x => x.getType() == FormApp.ItemType.PAGE_BREAK);
  if(sections.length != 3){
    Logger.log(sections);
    throw "Please create three sections";
  }

  Logger.log(categoryPairs);
  Logger.log(judges);

  let day1 = sections[0].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);
  let day2 = sections[1].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);
  let day3 = sections[2].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);

  let day_map = {};
  day_map["DAY1"] = day1;
  day_map["DAY2"] = day2;
  day_map["DAY3"] = day3;

  let candidatesWithCriterion = candidates.map(x => { 
    return { 
      name: x[0],  // candidate's name
      criteria: categoryPairs
        .filter(t => x[2] == t[0])
        .map(t => t[1]),
      day_no: x[1],  // day no
      catogory: x[2],  // category
      pitch_deck: x[5],  // pitch deck
      website: x[6],  // website
      country: x[7],
      about: x[8], //"==TODO: ABOUT==",
      logo: x[9], //icon
      summary: x[10] // ai-gen summary
      }  // Country
  }).filter(c => c.name != '' && c.criteria.length > 0);

  Logger.log("Fetching data is finished");

  // DRAW CONTROLS
  let jQ = _form.addListItem()
    .setTitle("Judge")
    .setHelpText("Find your name in the list...")
    .setRequired(true);

  Logger.log(`added judges control at index ${jQ.getIndex()}`);
  moveItemTo(jQ, 0);
  Logger.log("moved");

  moveToEnd(day1);

  Logger.log("Setting up conditionl select");
  jQ.setChoices(judges.map(j => jQ.createChoice(j[0], day_map[j[1]])))
    .setRequired(true);
  Logger.log("Done");

  generateGrid(candidatesWithCriterion, "DAY1");
 
  moveToEnd(day2);

  generateGrid(candidatesWithCriterion, "DAY2");

  moveToEnd(day3);

  generateGrid(candidatesWithCriterion, "DAY3");
}


function generateGrid(candidatesWithCriterion, day_no) {
  Logger.log(`Creating grid for ${day_no}`);

  candidatesWithCriterion.filter(x => x.day_no == day_no)
    .forEach(x =>{ 
      Logger.log(`Creating grid for ${x.name}...`);
      Logger.log(`Fetching an image from  ${x.logo}`);

      let img_item = _form.addImageItem()
        .setTitle(`Vote for ${x.name} (${x.country})`);

        try{
          if(x.logo.toLowerCase().startsWith("http")){
            img_item.setImage(UrlFetchApp.fetch(x.logo));
          } else{
            Logger.log("Using DriveApp service")
            img_item.setImage(DriveApp.getFileById(x.logo));
          }
        } catch (e){
          Logger.log(`Unable to get image for ${x.name} with Url ${x.logo}\n${e}`);
          img_item.setHelpText(`${x.name} startap's logo`);
        }

      let item = _form.addGridItem()
        .setTitle(x.name)
        .setRows(x.criteria.map(r => `${r}`)) 
        .setColumns(["skip",'BAD','NOT BAD','OK','EXCELLENT','FANTASTIC']) // 💣🤬🆗👎👍
        .setRequired(true)
        .setHelpText(
          `Country: ${x.country}
Site:  ${x.website}
Pitch deck: ${x.pitch_deck}
AI-generated summary:

${x.summary}

Please, rate ${x.name} using these criteria:`);
  let one2one = _form.addCheckboxItem()
        .setTitle(`I am opened for 1:1 with the ${x.name}'s team`)
        .setChoiceValues(["Yes"])
        .setRequired(false);
  Logger.log(`[OK]`);
      });

  Logger.log(`Done`);
}

function getTableByName(ws, name){
  let table = ws.getSheetByName(name)
    .getDataRange()
    .getValues();
  
  table.shift();

  return table;
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function moveItemTo(item, index){
  _form.moveItem(item.getIndex(), index);
}

function moveToEnd(item){
 _form.moveItem(item.getIndex(), _form.getItems().length - 1);
}
