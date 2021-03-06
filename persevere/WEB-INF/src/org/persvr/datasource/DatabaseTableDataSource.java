package org.persvr.datasource;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.persvr.data.DataSourceHelper;
import org.persvr.data.DataSourceManager;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.Query;
import org.persvr.data.QueryCantBeHandled;

/**
 * 
 * @author Kris Zyp
 * This is an SQL database table data source
 */
public class DatabaseTableDataSource extends DatabaseDataSource implements WritableDataSource, ChangeableData {
/*	static Timer timer = new Timer();
	static List<QueryIterator> currentIterators = new ArrayList<QueryIterator>();
	static final int CLEANUP_INTERVAL = 5000; // 5 seconds
	static void scheduleDisconnect(){
		// this does cleanup of the iterators to remove open result sets
		timer.schedule(new TimerTask(){

			@Override
			public void run() {
				for (Object item : Arrays.asList(currentIterators.toArray())){ // make a copy to iterate
					QueryIterator openQuery = (QueryIterator) item;
					if (openQuery.inUse)
						openQuery.inUse = false;
					else{ // has not been used for at least 5 seconds
						try {
							currentIterators.remove(openQuery);
							openQuery.rs.close();
						} catch (SQLException e) {
							e.printStackTrace();
						}
					}
				}
				scheduleDisconnect();
			}
			
		}, CLEANUP_INTERVAL);

	}*/
	protected Object getValueFromRs(ResultSet rs) throws Exception {
		ObjectId rowId = ObjectId.idForObject(DatabaseTableDataSource.this, rs.getString(columnCount + 1));
		// use the row to initialize this object
		synchronized(rowId){
			PersistableInitializer initializer = DataSourceHelper.initializeObject(rowId);
			mapResult(initializer, rs, rowId.subObjectId);
		}
		return rowId;
	}

	public Collection<Object> query(Query query) throws Exception {
		String fullSql = "select " + columnsString + "," + idColumn; 
		String countSql = "select count(" + idColumn + ")";
		String from;
		if (query.getSort() != null)
			throw new QueryCantBeHandled();

		if (query.getCondition() == null) {
			// this is the root object access, so we return the list of rows in the table
			from = " from " + table;
		}
		else {
			from = " from " + table + " where " + 
					addConditionToQuery(query.getCondition());
		}
		return new QueryIterator(fullSql + from, countSql + from);
	}
	String table;
	@Override
	ThreadSpecificConnectionObject setupConnection(Connection connection) throws SQLException {
		
		ConnectionStatements statements = new ConnectionStatements();
		try {
			statements.loadTable = connection.prepareStatement("select " + columnsString + " from " + table);
		}
		catch (SQLException e) {
			runStarterStatements();
			statements.loadTable = connection.prepareStatement("select " + columnsString + " from " + table);
		}
		statements.loadRow = connection.prepareStatement("select " + columnsString + " from " + table + " where " + idColumn + "=?");
		statements.deleteRow = connection.prepareStatement("DELETE FROM " + table + " WHERE " + idColumn + "=?");
		String valuesPlacement = "";
		for (int i = 0; i < columns.length;i++)
			if (!(columns[i] instanceof RelationalColumn) || ((RelationalColumn)columns[i]).relationshipType != RelationshipType.ONE_TO_MANY)
			valuesPlacement += i == 0 ? "?" : ",?";
		statements.insertRow = connection.prepareStatement("INSERT INTO " + table + " (" + columnsString + ") values (" + valuesPlacement + ")");
		return statements;
	}
	/**
	 * Just cast it to our specific connection object type
	 */
	@Override
	protected ConnectionStatements getConnectionObject() {
		return (ConnectionStatements) super.getConnectionObject();
	}
    class ConnectionStatements extends ThreadSpecificConnectionObject {
    	public PreparedStatement loadTable;
    	public PreparedStatement loadRow;
    	public PreparedStatement deleteRow;
    	public PreparedStatement insertRow;
    }
    int columnCount = 0;
    
	@Override
	public void initParameters(Map<String,Object> parameters) throws Exception {
    	table = (String) parameters.get("table");
    	idColumn = (String) parameters.get("idColumn");
    	List columnArray = (List) parameters.get("dataColumns");
    	Boolean camelCaseColumnNames = (Boolean) parameters.get("camelCaseColumnNames");
    	columns = new Column[columnArray.size()];
    	columnsString = "";
    	for (int i = 0; i < columns.length; i++) {
    		Object columnValue = columnArray.get(i);
    		Column column;
    		if (columnValue instanceof String) {
    			column = new Column();
    			column.databaseColumn = (String) columnValue;
    			String objectColumn = "";
    			boolean first = true;
    			if(Boolean.FALSE.equals(camelCaseColumnNames)){
    				objectColumn = (String) columnValue;
    			}
    			else{
	    			// camel case the database column name    			
	    			for (String part : ((String) columnValue).split("_")) {
	    				if (first)
	    					objectColumn += part.toLowerCase();
	    				else
	    					objectColumn += part.substring(0,1).toUpperCase() +part.substring(1).toLowerCase(); 
	    				first = false;
	    			}
    			}
    			column.objectColumn = objectColumn;
    			columnsString += columnValue + ",";
    			columnCount++;
    		}
    		else {
    			column = new RelationalColumn();
    			((RelationalColumn) column).foreignTable = (String) ((Map)columnValue).get("foreignSource");
    			((RelationalColumn) column).foreignColumn = (String) ((Map)columnValue).get("foreignColumn");
    			((RelationalColumn) column).foreignObjectColumn = (String) ((Map)columnValue).get("foreignObjectColumn");
    			((RelationalColumn) column).relationshipType = "one-to-many".equals(((Map)columnValue).get("relationshipType")) ? RelationshipType.ONE_TO_MANY : RelationshipType.MANY_TO_ONE;
    			column.databaseColumn = (String) ((Map)columnValue).get("databaseColumn");
    			if (((RelationalColumn) column).relationshipType == RelationshipType.MANY_TO_ONE){
    				columnsString += column.databaseColumn + ",";
    				columnCount++;
    			}
    			column.objectColumn = (String) ((Map)columnValue).get("objectColumn");
    		}
    		columns[i] = column;
    		
    	}
    	columnsString = columnsString.substring(0,columnsString.length()-1); // remove the last comma
    	super.initParameters(parameters);
    	/*timer.schedule(new TimerTask(){

			@Override
			public void run() {
				List<Update> updates = new ArrayList();
				updates.add(new Update(ObjectId.idForString("Project/3"),Update.UpdateType.Delete));
				DataSourceHelper.sendUpdates(updates);
			}
    		
    	}, 5000, 5000);*/
	}
	String idColumn;
	public static class Column {
		String databaseColumn;
		String objectColumn;
		Object type;
	}
	public enum RelationshipType {
		MANY_TO_ONE,ONE_TO_MANY;
	}
	public static class RelationalColumn extends Column {
		String foreignTable;
		String foreignColumn;
		String foreignObjectColumn;
		RelationshipType relationshipType;
	}
	Column[] columns;
	String columnsString;
    public Object getFieldValue(LazyPropertyId valueId) throws Exception {
    	throw new UnsupportedOperationException();
	}
    protected void mapResult(final PersistableInitializer initializer, ResultSet rs, String objectId) throws SQLException {
		int j = 1;
		for (int i = 0; i < columns.length; i++) {// load all the columns as properties
			Column column = columns[i];
			if (column instanceof RelationalColumn) {
				if (((RelationalColumn)column).relationshipType == RelationshipType.ONE_TO_MANY) { 
					initializer.setProperty(column.objectColumn, ObjectId.idForObject(DatabaseTableDataSource.this,objectId + '.' + column.objectColumn));
				}
				else{
					String foreignId = rs.getString(j++);
					initializer.setProperty(column.objectColumn, foreignId == null ? null:
						ObjectId.idForString(((RelationalColumn)column).foreignTable + '/' + foreignId));
				}
			}
			else
				initializer.setProperty(column.objectColumn, rs.getObject(j++));
		}
		initializer.getInitializingObject();
    }
	protected String nameInQuery(String name){
		for (Column column : columns){
			if (column.objectColumn.equals(name))
				return column.databaseColumn;
		}
		throw new RuntimeException("column " + name + " not found");
	}

	public void mapObject(final PersistableInitializer initializer, final String objectId) throws Exception {
		tryExecution(new DatabaseAction() {
			public Object execute() throws SQLException {
				if (objectId.indexOf('.') >= 0)
				{
					String field = objectId.substring(objectId.indexOf('.') + 1);
					String thisObjectId = objectId.substring(0,objectId.indexOf('.'));
					for (Column column : columns)
						if (column.objectColumn.equals(field)) {
							DataSource foreignSource = DataSourceManager.getSource(((RelationalColumn)column).foreignTable);
							if (foreignSource instanceof DatabaseTableDataSource) {
								PreparedStatement ps = ((DatabaseTableDataSource) foreignSource).getConnectionObject().connection.prepareStatement("select " + ((DatabaseTableDataSource)foreignSource).idColumn + " from " + ((DatabaseTableDataSource)foreignSource).table + " where " + ((RelationalColumn)column).foreignColumn + " = ?");
								ps.setString(1, thisObjectId);
								ResultSet rs = ps.executeQuery();
								List resultList = new ArrayList();// may want to have this initialized from an id, but not sure how to do it yet
								while (rs.next()) 
									resultList.add(ObjectId.idForObject(foreignSource, rs.getString(1)));
								initializer.initializeList(resultList);
								return null;
							}
							else
								throw new RuntimeException("Relationships must map to other database data sources");
						}
					throw new RuntimeException("Column was not found");
					
				}
				else
				{
					// we are going off the id of a specific row
					PreparedStatement loadStatement = getConnectionObject().loadRow;
					try {
						try{
							loadStatement.setInt(1, Integer.parseInt(objectId));
						}
						catch(NumberFormatException e){
							loadStatement.setString(1, objectId);
						}
						
					}catch (SQLException e){
						throw new ObjectNotFoundException(DatabaseTableDataSource.this,objectId);
					}
					ResultSet rs = loadStatement.executeQuery();
					if (!rs.next())
						throw new ObjectNotFoundException(DatabaseTableDataSource.this,objectId);
					mapResult(initializer,rs,objectId);
					rs.close();
				}
				return null;
			}
		});
	}
	public void recordListAdd(String objectId, Object value) throws Exception {
		if (objectId.indexOf('.') >= 0)
		{
			String field = objectId.substring(objectId.indexOf('.') + 1);
			String thisObjectId = objectId.substring(0,objectId.indexOf('.'));
			for (Column column : columns)
				if (column.objectColumn.equals(field)) {
					
					DataSource foreignSource = DataSourceManager.getSource(((RelationalColumn)column).foreignTable);
					if (foreignSource instanceof DatabaseTableDataSource) {
						// This is where we have add checks for different combinations of relational setups
						((ObjectId)value).getTarget().set(((RelationalColumn)column).foreignObjectColumn, ObjectId.idForObject(this, thisObjectId));
						((DatabaseTableDataSource) foreignSource).recordListAdd("", value);
						return;
						
					}
					else
						throw new RuntimeException("Relationships must map to other database data sources");
				}
			throw new RuntimeException("Column was not found");
			
		}
		else if (value instanceof ObjectId) {
			throw new RuntimeException("Can't add that object here");
		}
		throw new RuntimeException("Can not insert " + value + " into table " + table);
	}
	public NewObjectPersister recordNewObject(Persistable object) throws Exception {
		final Map<String,Object> props = new HashMap<String,Object>();
		return new NewObjectPersister() {
			
			public ObjectId getParent() {
				return ObjectId.idForObject(DatabaseTableDataSource.this, "");
			}
			public boolean reloadFromSource() {
				return true;
			}

			public boolean isHiddenId() {
				return false;
			}

			String objectId;
			public void start() throws Exception {
			}
			public void finished() throws Exception {
				String columnsString = "";
				String valuesPlacement = "";
				int j = 0;
				for (Map.Entry<String,Object> entry : props.entrySet()){
					for (int i = 0; i < columns.length; i++)
						if (columns[i].objectColumn.equals(entry.getKey())) {
							valuesPlacement += j == 0 ? "?" : ",?";
							columnsString += (j == 0 ? "" : ",") + columns[i].databaseColumn;
						}
				
					j++;
				}
				PreparedStatement insertRow = getConnectionObject().connection.prepareStatement("INSERT INTO " + table + " (" + columnsString + ") values (" + valuesPlacement + ")", PreparedStatement.RETURN_GENERATED_KEYS);
				j = 0;
				for (Map.Entry<String,Object> entry : props.entrySet()){
					Object value = entry.getValue();
					insertRow.setObject(j+1, value);
					j++;
				}
				for (int i = 0; i < columns.length;i++)
					if (!(columns[i] instanceof RelationalColumn) || ((RelationalColumn)columns[i]).relationshipType != RelationshipType.ONE_TO_MANY)
					valuesPlacement += i == 0 ? "?" : ",?";

				objectId = Long.toString(executeAndGetGeneratedKey(insertRow,table));
			}

			public String getObjectId() {
				return objectId;
			}

			public WritableDataSource getSource() {
				return DatabaseTableDataSource.this;
			}

			public void initializeAsFunction(String functionBody) throws Exception {
				throw new UnsupportedOperationException();
			}

			public void initializeAsList(List values) throws Exception {
				throw new UnsupportedOperationException();
			}

			public void recordProperty(String name, Object value) throws Exception {
				for (int i = 0; i < columns.length; i++)
					if (columns[i].objectColumn.equals(name)) {
						if (value instanceof Persistable)
							value = ((Persistable)value).getId();
						if (value instanceof ObjectId)
							value = ((ObjectId)value).getSubObjectId();
						props.put(name, value);
						return;
					}
				throw new RuntimeException("Column for property " + name + " not found");
			}
		};
	}

	public void recordListRemoval(String objectId, Object value) throws Exception {
		if (value instanceof ObjectId) {
			PreparedStatement deleteRow = getConnectionObject().deleteRow;
			if (((ObjectId)value).source != this)
				throw new RuntimeException("Can not delete an object that is not in this source");
			deleteRow.setLong(1,Long.parseLong(((ObjectId)value).subObjectId));
			deleteRow.execute();
			return;
		}
		throw new RuntimeException("Can not delete " + value + " from table " + table);
	}
	public void recordPropertyAddition(String objectId, String name, Object value, int attributes) throws Exception {
		recordPropertyChange(objectId, name, value, 0);
	}
	public void recordPropertyChange(String objectId, String name, Object value, int attributes) throws Exception {
		for (int i = 0; i < columns.length; i++)
			if (columns[i].objectColumn.equals(name)) { // Do this to ensure it is valid name
				PreparedStatement statement = getConnectionObject().getConnection().prepareStatement("UPDATE " + table + " SET " + columns[i].databaseColumn + "=? WHERE " + idColumn + "=?");
				statement.setObject(1, value);
				statement.setString(2, objectId);
				statement.execute();
				return;
			}
		throw new RuntimeException("The column " + name + " is not registered as a valid column in this table");
	}
	public void recordPropertyRemoval(String objectId, String name) throws Exception {
		recordPropertyChange(objectId, name, null, 0);
	}
	public void recordDelete(String objectId) throws Exception {
		PreparedStatement deleteRow = getConnectionObject().deleteRow;
		deleteRow.setLong(1,Long.parseLong(objectId));
		deleteRow.execute();	
	}

	public boolean doesObjectNeedUpdating(String id) {
		return true;
	}
	//Timer timer = new Timer();
}
