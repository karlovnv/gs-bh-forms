let _form_url = "https://docs.google.com/forms/..../edit";
let _form = FormApp.openByUrl(_form_url)
let _ws_url = "https://docs.google.com/spreadsheets/.../edit"

function clearForm(){
  // remove generated items
  Logger.log("Removing dynamic controls...");
  _form.getItems().filter(x => x.getType() == FormApp.ItemType.LIST).forEach(x => { _form.deleteItem(x)});
  _form.getItems().filter(x => x.getType() == FormApp.ItemType.GRID).forEach(x => { _form.deleteItem(x)});
  Logger.log("[OK] ");
}

function deleteAllResponces(){
    _form.deleteAllResponses();
}
function setupForm() {
  let ws = SpreadsheetApp.openByUrl(_ws_url);

  let judges = getTableByName(ws, "Judges").map(row => [row[0], row[2]]);
  let categoryPairs = getTableByName(ws, "Categories");
  let candidates =  getTableByName(ws, "Candidates");
  
  let sections = _form.getItems().filter(x => x.getType() == FormApp.ItemType.PAGE_BREAK);
  if(sections.length != 3){
    Logger.log(sections);
    throw "Please create three sections";
  }

  Logger.log(judges);

  let day1 = sections[0].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);
  let day2 = sections[1].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);
  let day3 = sections[2].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);

  let day_map = {};
  day_map["DAY1"] = day1;
  day_map["DAY2"] = day2;
  day_map["DAY3"] = day3;

  let candidatesWithCriterion = candidates.map(x => { 
    return [ 
      x[0],  // candidate's name
      categoryPairs
        .filter(t => x[2] == t[0])
        .map(t => t[1]),
      x[1],  // day no
      x[2],  // category
      x[5],  // pitch deck
      x[6],  // website
      x[7],
      x[8] //"==TODO: ABOUT==", 
      ]  // Country
  }).filter(x => x[1].length > 0);

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

  candidatesWithCriterion.filter(x => x[2]==day_no)
    .forEach(x =>{ 
      let item = _form.addGridItem()
        .setTitle(x[0])
        .setRows(x[1].map(r => `${r}`)) 
        .setColumns(["Skip", 1, 2, 3, 4, 5])
        .setRequired(true)
        .setHelpText(
          `
${x[3]} (${x[6]})
==============================================================
Site:  ${x[5]}
Pitch deck: ${x[4]}
==============================================================

About
==============================================================
${x[7]}
==============================================================

Rate on a scale from 1 to 5 or skip (bigger is better)`);
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

