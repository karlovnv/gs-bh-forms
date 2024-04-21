//let _form = FormApp.getActiveForm(); 
let _form = FormApp.openByUrl(PLACE_YOUR_URL_OF_FORM_HERE);

let _ws_url = PLACE_YOUR_URL_HERE;

function clearForm(){
  // remove generated items
  _form.getItems().filter(x => x.getType() == FormApp.ItemType.LIST).forEach(x => { _form.deleteItem(x)});
  _form.getItems().filter(x => x.getType() == FormApp.ItemType.GRID).forEach(x => { _form.deleteItem(x)});
}

function deleteAllResponces(){
    _form.deleteAllResponses();
}
function setupForm() {
  let ws = SpreadsheetApp.openByUrl(_ws_url);

  let judges = getTableByName(ws, "Judges").map(row => row[0]);
  let categoryPairs = getTableByName(ws, "Categories");
  let candidates =  getTableByName(ws, "Candidates");
  
  let sections = _form.getItems().filter(x => x.getType() == FormApp.ItemType.PAGE_BREAK);
  if(sections.length != 2){
    Logger.log(sections);
    throw "Please create two sections";
  }

  let day1 = sections[0].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);
  let day2 = sections[1].asPageBreakItem().setGoToPage(FormApp.PageNavigationType.SUBMIT);

  let candidatesWithCriterion = candidates.map(x => { 
    return [ 
      x[0],  // candidate's name
      categoryPairs
        .filter(t => x[2] == t[0])
        .map(t => t[1]),
      x[1],  // day no
      x[2],  // category
      x[5],  // pitch deck
      x[6],  //website
      x[7]]  //country
  }).filter(x => x[1].length > 0);

  Logger.log(candidatesWithCriterion);

  // DRAW CONTROLS
  let jQ = _form.addListItem().setTitle("Judge")
    .setChoiceValues(judges)
    .setRequired(true);
  moveItemTo(jQ, 0);

  let dSelector = _form.addListItem()
    .setTitle("Day")
    .setRequired(true); 
  moveItemTo(dSelector, 1);

  let length = _form.getItems().length;

  candidatesWithCriterion.filter(x => x[2]=="DAY1")
    .forEach(x =>{ 
      let item = _form.addGridItem()
        .setTitle(x[0])
        .setRows(x[1].map(r => `${r}`)) 
        .setColumns(["Skip", 1, 2, 3, 4, 5])
        .setRequired(true)
        .setHelpText(
          `
${x[3]} (${x[6]})
Site:  ${x[5]}
Pitch deck: ${x[4]}

Rate on a scale from 1 to 5 or skip`);
      });

  _form.moveItem(day1.getIndex(), length - 1);
  
  let length2 = _form.getItems().length;

  candidatesWithCriterion.filter(x => x[2]=="DAY2")
    .forEach(x =>{ 
      let item = _form.addGridItem()
        .setTitle(x[0])
        .setRows(x[1].map(r => `${r}`)) 
        .setColumns(["Skip", 1, 2, 3, 4, 5])
        .setRequired(true)
        .setHelpText(
          `
${x[3]} (${x[6]})
Site:  ${x[5]}
Pitch deck: ${x[4]}

Rate on a scale from 1 to 5 or skip`);
      });

  _form.moveItem(day2.getIndex(), length2 - 1);

  dSelector.setChoices([
    dSelector.createChoice('Day1', day1), 
    dSelector.createChoice('Day2', day2)])
  .setRequired(true);
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
  _form.moveItem(item.getIndex(), 1);
}
