List<Budget__c> budgets = new List<Budget>(); 

String[] accntNumberPrefix = new String[]{'CD', 'CC'};

for(i=0; i<10; i++){
   Budget__c b = new Budget__c();

   b.Budget_Type__C = "OPEX"
   b.Budget_Name__c = "Location " + i.toString();
   b.Budget_Year__c = 2022;
   b.Status__c = "Draft";

   budgets.push(b)
}

// Update the database
insert budgets;
 
