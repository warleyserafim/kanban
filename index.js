const express = require("express") ;
const app = express();

const port = 4000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const cors = require("cors");

app.use(cors());

const http = require("http")
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://152.67.43.35:3000",
        methods: ["GET", "POST"]
    }
});





const fetchID = () => Math.random().toString(36).substring(2, 10);

//👇🏻 Nested object
let tasks = {
    pending: {
        title: "pending",
        items: [
            {
                id: fetchID(),
                title: "Send the Figma file to Dima",
                comments: [],
            },
        ],
    },
    ongoing: {
        title: "ongoing",
        items: [
            {
                id: fetchID(),
                title: "Review GitHub issues",
                comments: [
                    {
                        name: "David",
                        text: "Ensure you review before merging",
                        id: fetchID(),
                    },
                ],
            },
        ],
    },
    completed: {
        title: "completed",
        items: [
            {
                id: fetchID(),
                title: "Create technical contents",
                comments: [
                    {
                        name: "Dima",
                        text: "Make sure you check the requirements",
                        id: fetchID(),
                    },
                ],
            },
        ],
    },
};

app.get("/api", (req, res) => {
    res.json(tasks);
});


io.on("connection", (socket) => {
    console.log("a user connected");

    // 👇🏻 Ouvinte para o evento de movimentação de tarefas
    socket.on("taskDragged", (data) => {
        const { source, destination } = data;

        const itemMoved = {...tasks[source.droppableId].items[source.index],};

        console.log("DraggedItem>>>", itemMoved);

        tasks[source.droppableId].items.splice(source.index, 1);

        tasks[destination.droppableId].items.splice(destination.index, 0, itemMoved);

        socket.emit("tasks", tasks)
    });


    // 👇🏻 Ouvinte para o evento de criaçao de tarefas
    socket.on("createTask", (data) => {
        const newTask = {id: fetchID(), title: data.task, comments: []};

        tasks["pending"].items.push(newTask);

        socket.emit("tasks", tasks)
    })


    // 👇🏻 Ouvinte para o evento de criaçao de comentários
	socket.on("fetchComments", (data) => {
		const taskItems = tasks[data.category].items;
		for (let i = 0; i < taskItems.length; i++) {
			if (taskItems[i].id === data.id) {
				socket.emit("comments", taskItems[i].comments);
			}
		}
	});
	socket.on("addComment", (data) => {
		const taskItems = tasks[data.category].items;
		for (let i = 0; i < taskItems.length; i++) {
			if (taskItems[i].id === data.id) {
				taskItems[i].comments.push({
					name: data.userId,
					text: data.comment,
					id: fetchID(),
				});
				socket.emit("comments", taskItems[i].comments);
			}
		}
	});


    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});




// socketIO.on('connection', (socket) => {
//     console.log(`⚡: ${socket.id} user just connected!`);


//     socket.on('disconnect', () => {
//             socket.disconnect()
//       console.log('🔥: A user disconnected');
//     });
// });

server.listen(port || 8080, () =>{
    console.log(`Server listening on ${port}`);
});
