## Port of Ros2 Robot Teleop Demo

Original Demo can be found here at [zenoh-demos](https://github.com/eclipse-zenoh/zenoh-demos)

This demo must be run with the Remote-API plugin running on a Zenohd instance,

If using a phsycial Turtlebot3, the Turtlebot must be running `zenoh-bridge-ros2dds` with the same Ros2 Scope as the webpage.

The easiest way to achieve this is to connect directly from the Robot to the zenohd instance running the remote-api plugin  
`./zenoh-bridge-ros2dds -n "/bot" -e tcp/<IP ADDR>:7447`
