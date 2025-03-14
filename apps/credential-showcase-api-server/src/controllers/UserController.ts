import { Body, Delete, Get, HttpCode, JsonController, OnUndefined, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'
import { UserRequest, UserResponse, UserResponseFromJSONTyped, UsersResponse, UsersResponseFromJSONTyped } from 'credential-showcase-openapi'
import { userDTOFrom, newUserFrom } from '../utils/mappers'
import UserService from '../services/UserService'

@JsonController('/users')
@Service()
class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  public async getAll(): Promise<UsersResponse> {
    const result = await this.userService.getUsers()
    const users = result.map((user) => userDTOFrom(user))
    return UsersResponseFromJSONTyped({ users }, false)
  }

  @Get('/:id')
  public async getOne(@Param('id') id: string): Promise<UserResponse> {
    const result = await this.userService.getUser(id)
    return UserResponseFromJSONTyped({ asset: userDTOFrom(result) }, false)
  }

  @HttpCode(201)
  @Post('/')
  public async post(@Body() userRequest: UserRequest): Promise<UserResponse> {
    const result = await this.userService.createUser(newUserFrom(userRequest))
    return UserResponseFromJSONTyped({ user: userDTOFrom(result) }, false)
  }

  @Put('/:id')
  public async put(@Param('id') id: string, @Body() userRequest: UserRequest): Promise<UserResponse> {
    const result = await this.userService.updateUser(id, newUserFrom(userRequest))
    return UserResponseFromJSONTyped({ user: userDTOFrom(result) }, false)
  }

  @OnUndefined(204)
  @Delete('/:id')
  public async delete(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id)
  }
}

export default UserController
