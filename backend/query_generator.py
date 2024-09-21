import json
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

def load_prompt_template():
    with open("backend/prompt.txt", "r") as file:
        prompt_content = file.read()
   
    escaped_content = prompt_content.replace("{", "{{").replace("}", "}}")
    final_template = escaped_content + "\n\nUser question: {question}\n\nSample questions:\n{sample}\n\nMongoDB query:"
   
    return PromptTemplate(template=final_template, input_variables=["question", "sample"])

def setup_langchain(prompt):
    llm = ChatOpenAI(model="gpt-4o", temperature=0.0)
    return LLMChain(llm=llm, prompt=prompt, verbose=True)

def generate_and_execute_query(chain, question, collection):
    try:
        with open("backend/sample.txt", "r") as file:
            sample = file.read()
       
        response = chain.invoke({
            "question": question,
            "sample": sample
        })
        query_string = response["text"].strip()
        try:
            query = json.loads(query_string)
        except json.JSONDecodeError:
            print(f"Error: The model's response is not valid JSON. Response: {query_string}")
            return []
       
        try:
            results = list(collection.aggregate(query))
            return results
        except Exception as e:
            print(f"Error executing the query: {str(e)}")
            return []
    except Exception as e:
        print(f"Error generating query: {str(e)}")
        return []